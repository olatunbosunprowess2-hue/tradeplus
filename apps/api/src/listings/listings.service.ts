import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingQueryDto } from './dto/listing-query.dto';

import { ActivityService } from '../activity/activity.service';
import { BarterService } from '../barter/barter.service';
import { WantsService } from '../wants/wants.service';
import { SecurityService } from '../security/security.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ListingsService {

    constructor(
        private prisma: PrismaService,
        private activityService: ActivityService,
        private barterService: BarterService,
        private wantsService: WantsService,
        private securityService: SecurityService,
        private notificationsService: NotificationsService
    ) { }


    async create(userId: string, dto: CreateListingDto) {
        // 0. Security: Rate Limiting
        const { allowed, warning } = await this.securityService.checkListingRateLimit(userId);

        if (!allowed) {
            throw new ForbiddenException(
                'You have reached your hourly listing limit (20 per hour). Please wait a moment before posting again.',
            );
        }

        if (warning) {
            // Trigger a warning notification
            await this.notificationsService.create(userId, 'RATE_LIMIT_WARNING', {
                title: 'Posting Limit Warning',
                message: 'You are approaching your hourly listing limit. You can post a maximum of 20 items per hour.',
            });
        }

        const { imageUrls, ...listingData } = dto;


        // Validate that at least one payment mode is enabled
        if (!dto.allowCash && !dto.allowBarter && !dto.allowCashPlusBarter) {
            throw new ForbiddenException(
                'At least one payment mode must be enabled',
            );
        }

        // Validate price if cash is allowed
        if (dto.allowCash && dto.priceCents !== undefined && dto.priceCents < 0) {
            throw new ForbiddenException('Price cannot be negative');
        }

        // Fraud Detection: Listing Spam Protection
        // 1. Check for rapid listing creation (>5 listings in 10 minutes)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const recentListingsCount = await this.prisma.listing.count({
            where: {
                sellerId: userId,
                createdAt: { gt: tenMinutesAgo },
            },
        });

        if (recentListingsCount >= 5) {
            throw new ForbiddenException('You are creating listings too quickly. Please wait a few minutes.');
        }

        // 2. Check for duplicate active listing titles by same user
        const existingDuplicate = await this.prisma.listing.findFirst({
            where: {
                sellerId: userId,
                title: { equals: dto.title, mode: 'insensitive' },
                status: 'active',
            },
        });

        if (existingDuplicate) {
            throw new ForbiddenException('You already have an active listing with this title.');
        }

        // Fetch user profile to get default location
        const userProfile = await this.prisma.userProfile.findUnique({
            where: { userId },
        });

        try {
            const prismaData = {
                ...listingData,
                sellerId: userId,
                priceCents: dto.priceCents ? BigInt(Math.round(dto.priceCents)) : null,
                currencyCode: dto.currencyCode || 'USD',
                downpaymentCents: dto.downpaymentCents ? BigInt(Math.round(dto.downpaymentCents)) : null,
                downpaymentCurrency: dto.downpaymentCurrency || null,
                quantity: dto.type === 'SERVICE' ? 1 : (dto.quantity || 1),
                isAvailable: dto.type === 'SERVICE' ? (dto.isAvailable ?? true) : true,
                shippingMeetInPerson: dto.shippingMeetInPerson ?? true,
                shippingShipItem: dto.shippingShipItem ?? false,
                // Default to seller's location if not provided
                countryId: dto.countryId || userProfile?.countryId,
                regionId: dto.regionId || userProfile?.regionId,
                videoUrl: dto.videoUrl || null,
                images: imageUrls
                    ? {
                        create: imageUrls.map((url, index) => ({
                            url,
                            sortOrder: index,
                        })),
                    }
                    : undefined,
            };

            // Log debug info to file
            try {
                const fs = require('fs');
                const logPath = 'C:/Users/PC/Desktop/BarterWave/BarterWave/debug_listing.log';
                fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] PRISMA CREATE DATA: ${JSON.stringify(prismaData, (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value
                    , 2)}\n`);
            } catch (e) {
                console.error('Failed to write debug log:', e);
            }

            const listing = await this.prisma.listing.create({
                data: prismaData,
                include: {
                    seller: {
                        include: {
                            profile: {
                                include: {
                                    country: true,
                                    region: true,
                                },
                            },
                        },
                    },
                    category: true,
                    images: {
                        orderBy: { sortOrder: 'asc' },
                    },
                    country: true,
                    region: true,
                },
            });

            // 5. Trigger Activity Feed
            this.activityService.handleAdCreated(listing.id, userId, listing.title).catch(err => {
                console.error('Failed to trigger activity feed for listing:', err);
            });

            // 6. Trigger Wants Matching Engine
            this.wantsService.checkMatchesForListing(listing.id).catch(err => {
                console.error('Failed to trigger wants matching for listing:', err);
            });

            return {
                ...listing,
                priceCents: listing.priceCents ? Number(listing.priceCents) : null,
                downpaymentCents: listing.downpaymentCents ? Number(listing.downpaymentCents) : null,
            };
        } catch (error) {
            console.error('Error in ListingsService.create:', error);
            throw error;
        }
    }

    async findAll(query: ListingQueryDto) {
        const {
            categoryId,
            search,
            condition,
            paymentMode,
            minPrice,
            maxPrice,
            countryId,
            regionId,
            sellerId,
            isDistressSale,
            page = 1,
            limit = 20,
        } = query;

        const skip = (page - 1) * limit;

        // Use AND array to combine mutually exclusive groups of conditions
        const andConditions: any[] = [];

        // If includeAll is true (usually for profile pages), don't filter by status: active
        if (query.includeAll !== 'true' && String(query.includeAll) !== 'true') {
            andConditions.push({ status: 'active' });
        }

        if (sellerId) {
            andConditions.push({ sellerId });
        }

        if (query.ids) {
            const ids = query.ids.split(',').map(id => id.trim()).filter(id => id.length > 0);
            if (ids.length > 0) {
                andConditions.push({ id: { in: ids } });
            }
        }

        if (categoryId) {
            andConditions.push({ categoryId });
        }

        if (condition) {
            andConditions.push({ condition });
        }

        if (query.type) {
            andConditions.push({ type: query.type });
        }

        // Distress Sale Filter
        if (isDistressSale !== undefined && String(isDistressSale) === 'true') {
            // /distress page: Show only distress sales
            andConditions.push({ isDistressSale: true });
        } else {
            // Normal listings: Show non-distress OR cross-listed distress items
            andConditions.push({
                OR: [
                    { isDistressSale: false },
                    { isDistressSale: true, isCrossListed: true }, // Paid cross-list boost
                ]
            });
        }

        if (search) {
            const terms = search.trim().split(/\s+/).filter(t => t.length > 0).join(' & ');
            andConditions.push({
                OR: [
                    { title: { search: terms } },
                    { description: { search: terms } },
                    // Fallback for substring matching for shorter queries
                    { title: { contains: search, mode: 'insensitive' } },
                ]
            });
        }

        if (paymentMode === 'cash') {
            andConditions.push({ allowCash: true });
        } else if (paymentMode === 'barter') {
            andConditions.push({ allowBarter: true });
        } else if (paymentMode === 'cash_plus_barter') {
            andConditions.push({ allowCashPlusBarter: true });
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            const priceFilter: any = {};
            if (minPrice !== undefined) {
                priceFilter.gte = BigInt(minPrice);
            }
            if (maxPrice !== undefined) {
                priceFilter.lte = BigInt(maxPrice);
            }
            andConditions.push({ priceCents: priceFilter });
        }

        if (countryId) {
            andConditions.push({ countryId });
        }

        if (regionId) {
            andConditions.push({ regionId });
        }

        const where: any = {
            AND: andConditions
        };


        const [listings, total] = await Promise.all([
            this.prisma.listing.findMany({
                where,
                skip,
                take: limit,
                // OPTIMIZATION: Use select instead of include to fetch only what's needed
                select: {
                    id: true,
                    title: true,
                    description: true,
                    priceCents: true,
                    currencyCode: true,
                    downpaymentCents: true,
                    downpaymentCurrency: true,
                    type: true,
                    condition: true,
                    status: true,
                    updatedAt: true,
                    createdAt: true,
                    allowCash: true,
                    allowBarter: true,
                    allowCashPlusBarter: true,
                    quantity: true,
                    isAvailable: true,
                    isDistressSale: true,
                    isCrossListed: true,
                    isFeatured: true,
                    spotlightExpiry: true,
                    // Only fetch the first image for the card preview to save bandwidth
                    images: {
                        orderBy: { sortOrder: 'asc' },
                        take: 1,
                        select: { url: true }
                    },
                    category: {
                        select: { id: true, name: true, slug: true }
                    },
                    country: {
                        select: { id: true, name: true }
                    },
                    region: {
                        select: { id: true, name: true }
                    },
                    sellerId: true,
                    seller: {
                        select: {
                            id: true,
                            email: true,
                            isVerified: true,
                            locationAddress: true,
                            tier: true,
                            brandVerificationStatus: true,
                            brandName: true,
                            brandPhysicalAddress: true,
                            brandWhatsApp: true,
                            profile: {
                                select: {
                                    displayName: true,
                                    avatarUrl: true,
                                    region: {
                                        select: { name: true }
                                    }
                                }
                            }
                        }
                    }
                },
                // OPTIMIZATION: Use simpler sort for distress page to avoid expensive joins
                // For distress sales, we just want the newest ones first
                orderBy: (isDistressSale !== undefined && String(isDistressSale) === 'true')
                    ? [{ createdAt: 'desc' }]
                    : [
                        { isFeatured: 'desc' },
                        { spotlightExpiry: { sort: 'desc', nulls: 'last' } },
                        { seller: { tier: 'desc' } },  // Premium sellers above free users
                        { createdAt: 'desc' },
                    ],
            }),
            this.prisma.listing.count({ where }),
        ]);

        return {
            data: listings.map((listing) => ({
                ...listing,
                priceCents: listing.priceCents ? Number(listing.priceCents) : null,
                downpaymentCents: (listing as any).downpaymentCents ? Number((listing as any).downpaymentCents) : null,
                // Ensure images array structure matches expected DTO
                images: listing.images || []
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        // Validate UUID format to prevent 500 errors from Prisma
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        // Log to file for deep tracing
        try {
            const fs = require('fs');
            const logPath = 'C:/Users/PC/Desktop/BarterWave/BarterWave/debug_api.log';
            fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] findOne called for ID: ${id}`);
        } catch (e) {
            console.error('Failed to write debug log:', e);
        }

        if (!uuidRegex.test(id)) {
            try {
                const fs = require('fs');
                const logPath = 'C:/Users/PC/Desktop/BarterWave/BarterWave/debug_api.log';
                fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] findOne: Invalid UUID format: ${id}`);
            } catch (e) { }
            throw new NotFoundException('Invalid listing ID format');
        }

        try {
            const listing = await this.prisma.listing.findUnique({
                where: { id },
                include: {
                    seller: {
                        include: {
                            profile: {
                                include: {
                                    country: true,
                                    region: true,
                                },
                            },
                        },
                    },
                    category: true,
                    images: {
                        orderBy: { sortOrder: 'asc' },
                    },
                    country: true,
                    region: true,
                },
            });

            if (!listing) {
                try {
                    const fs = require('fs');
                    const logPath = 'C:/Users/PC/Desktop/BarterWave/BarterWave/debug_api.log';
                    fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] findOne: Listing not found in DB: ${id}`);
                } catch (e) { }
                throw new NotFoundException('Listing not found');
            }

            const result = {
                ...listing,
                priceCents: listing.priceCents ? Number(listing.priceCents) : null,
                downpaymentCents: listing.downpaymentCents ? Number(listing.downpaymentCents) : null,
            };

            try {
                const fs = require('fs');
                const logPath = 'C:/Users/PC/Desktop/BarterWave/BarterWave/debug_api.log';
                fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] findOne: Successfully returning listing: ${listing.title}`);
            } catch (e) { }

            return result;
        } catch (error) {
            try {
                const fs = require('fs');
                const logPath = 'C:/Users/PC/Desktop/BarterWave/BarterWave/debug_api.log';
                fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] findOne ERROR for ${id}: ${error.message}\n${error.stack}`);
            } catch (e) { }

            if (error instanceof NotFoundException) throw error;
            console.error(`[ERROR] Unexpected failure in findOne(${id}):`, error);
            throw error;
        }
    }
    async findByUser(userId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;
        const where = {
            sellerId: userId,
            status: {
                not: 'removed',
            },
        };

        const [listings, total] = await Promise.all([
            this.prisma.listing.findMany({
                where,
                include: {
                    category: true,
                    images: {
                        orderBy: { sortOrder: 'asc' },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.listing.count({ where })
        ]);

        return {
            data: listings.map((listing) => ({
                ...listing,
                priceCents: listing.priceCents ? Number(listing.priceCents) : null,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }


    async update(id: string, userId: string, dto: UpdateListingDto) {
        const listing = await this.prisma.listing.findUnique({
            where: { id },
        });

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        if (listing.sellerId !== userId) {
            throw new ForbiddenException('You can only update your own listings');
        }

        const { imageUrls, priceCents, downpaymentCents, status, ...listingData } = dto;

        // Handle image updates
        if (imageUrls) {
            // Delete existing images
            await this.prisma.listingImage.deleteMany({
                where: { listingId: id },
            });

            // Create new images
            await this.prisma.listingImage.createMany({
                data: imageUrls.map((url, index) => ({
                    listingId: id,
                    url,
                    sortOrder: index,
                })),
            });
        }

        // Prepare update data
        const updateData: any = { ...listingData };
        if (priceCents !== undefined) {
            updateData.priceCents = priceCents ? BigInt(priceCents) : null;
        }
        if (downpaymentCents !== undefined) {
            updateData.downpaymentCents = downpaymentCents ? BigInt(downpaymentCents) : null;
        }
        if (status) {
            updateData.status = status;
        }

        // Auto-TRADED: If product quantity reaches 0, auto-mark as traded
        if (listing.type === 'PHYSICAL' && updateData.quantity !== undefined && updateData.quantity <= 0) {
            updateData.status = 'traded';
            updateData.quantity = 0;
        }

        const updated = await this.prisma.listing.update({
            where: { id },
            data: updateData,
            include: {
                seller: {
                    include: {
                        profile: {
                            include: {
                                country: true,
                                region: true,
                            },
                        },
                    },
                },
                category: true,
                images: {
                    orderBy: { sortOrder: 'asc' },
                },
                country: true,
                region: true,
            },
        });

        // Revalidate pending barter offers if status or quantity changed
        if (updateData.status || updateData.quantity !== undefined) {
            await this.barterService.validateInTradeQuantities(id, userId);
        }

        return {
            ...updated,
            priceCents: updated.priceCents ? Number(updated.priceCents) : null,
            downpaymentCents: updated.downpaymentCents ? Number(updated.downpaymentCents) : null,
        };

    }

    async remove(id: string, userId: string) {
        const listing = await this.prisma.listing.findUnique({
            where: { id },
        });

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        if (listing.sellerId !== userId) {
            throw new ForbiddenException('You can only delete your own listings');
        }

        const deleted = await this.prisma.listing.update({
            where: { id },
            data: { status: 'removed', deletedAt: new Date() },
        });

        // Revalidate pending barter offers (they should be cancelled since status is no longer active)
        await this.barterService.validateInTradeQuantities(id, userId);

        return { message: 'Listing deleted successfully' };
    }

    /**
     * Record a listing view for a user (used for Aggressive Boost targeting)
     */
    async recordView(listingId: string, userId: string): Promise<void> {
        // Verify listing exists
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId },
            select: { id: true, sellerId: true, categoryId: true },
        });

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        // Don't record views of own listings
        if (listing.sellerId === userId) {
            return;
        }

        // Upsert the view - update timestamp if exists, create if new
        await this.prisma.recentlyViewed.upsert({
            where: {
                userId_listingId: {
                    userId,
                    listingId,
                },
            },
            update: {
                viewedAt: new Date(),
            },
            create: {
                userId,
                listingId,
                viewedAt: new Date(),
            },
        });

        console.log(`📋 [VIEW TRACKED] User ${userId.slice(0, 8)}... viewed listing ${listingId.slice(0, 8)}... (category: ${listing.categoryId})`);
    }

}
