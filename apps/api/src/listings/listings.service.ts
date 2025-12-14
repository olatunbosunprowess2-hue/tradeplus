import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingQueryDto } from './dto/listing-query.dto';

@Injectable()
export class ListingsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, dto: CreateListingDto) {
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
                quantity: dto.quantity || 1,
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
                const logPath = 'C:/Users/PC/Desktop/TradePlus/TradePlus/debug_listing.log';
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

            return {
                ...listing,
                priceCents: listing.priceCents ? Number(listing.priceCents) : null,
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

        const where: any = {
            status: 'active',
        };

        if (sellerId) {
            where.sellerId = sellerId;
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (condition) {
            where.condition = condition;
        }

        if (query.type) {
            where.type = query.type;
        }

        // Distress Sale Filter
        if (isDistressSale !== undefined && String(isDistressSale) === 'true') {
            where.isDistressSale = true;
        }

        if (search) {
            // Use split terms for better search matching if multiple words
            const terms = search.trim().split(/\s+/).join(' & ');
            where.OR = [
                // Prioritize exact/partial text match for better relevance
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                // Fallback to searching category name
                { category: { name: { contains: search, mode: 'insensitive' } } },
            ];

            // Note: If you have enabled previewFeatures=["fullTextSearch"], you could use this:
            // where.OR = [
            //    { title: { search: terms } },
            //    { description: { search: terms } },
            // ];
            // However, sticking to 'contains' ensures substring matches work (e.g. 'pho' matches 'phone')
            // which users often expect, whereas FTS usually scans full words.
            // We optimize performance by reducing the SELECT payload below.
        }

        if (paymentMode === 'cash') {
            where.allowCash = true;
        } else if (paymentMode === 'barter') {
            where.allowBarter = true;
        } else if (paymentMode === 'cash_plus_barter') {
            where.allowCashPlusBarter = true;
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.priceCents = {};
            if (minPrice !== undefined) {
                where.priceCents.gte = BigInt(minPrice);
            }
            if (maxPrice !== undefined) {
                where.priceCents.lte = BigInt(maxPrice);
            }
        }

        if (countryId) {
            where.countryId = countryId;
        }

        if (regionId) {
            where.regionId = regionId;
        }

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
                    type: true,
                    condition: true,
                    status: true,
                    updatedAt: true,
                    createdAt: true,
                    allowCash: true,
                    allowBarter: true,
                    allowCashPlusBarter: true,
                    quantity: true,
                    isDistressSale: true,
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
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.listing.count({ where }),
        ]);

        return {
            data: listings.map((listing) => ({
                ...listing,
                priceCents: listing.priceCents ? Number(listing.priceCents) : null,
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
            throw new NotFoundException('Listing not found');
        }

        return {
            ...listing,
            priceCents: listing.priceCents ? Number(listing.priceCents) : null,
        };
    }

    async findByUser(userId: string) {
        const listings = await this.prisma.listing.findMany({
            where: {
                sellerId: userId,
                status: {
                    not: 'removed',
                },
            },
            include: {
                category: true,
                images: {
                    orderBy: { sortOrder: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return listings.map((listing) => ({
            ...listing,
            priceCents: listing.priceCents ? Number(listing.priceCents) : null,
        }));
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

        const { imageUrls, priceCents, status, ...listingData } = dto;

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
        if (status) {
            updateData.status = status;
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

        return {
            ...updated,
            priceCents: updated.priceCents ? Number(updated.priceCents) : null,
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

        await this.prisma.listing.update({
            where: { id },
            data: { status: 'removed' },
        });

        return { message: 'Listing deleted successfully' };
    }
}
