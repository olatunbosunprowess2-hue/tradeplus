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

        const listing = await this.prisma.listing.create({
            data: {
                ...listingData,
                sellerId: userId,
                priceCents: dto.priceCents ? BigInt(dto.priceCents) : null,
                currencyCode: dto.currencyCode || 'USD',
                quantity: dto.quantity || 1,
                shippingMeetInPerson: dto.shippingMeetInPerson ?? true,
                shippingShipItem: dto.shippingShipItem ?? false,
                images: imageUrls
                    ? {
                        create: imageUrls.map((url, index) => ({
                            url,
                            sortOrder: index,
                        })),
                    }
                    : undefined,
            },
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
            page = 1,
            limit = 20,
        } = query;

        const skip = (page - 1) * limit;

        const where: any = {
            status: 'active',
        };

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (condition) {
            where.condition = condition;
        }

        if (query.type) {
            where.type = query.type;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { category: { name: { contains: search, mode: 'insensitive' } } },
            ];
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
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.listing.count({ where }),
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

        const { imageUrls, priceCents, ...listingData } = dto;

        // Handle image updates
        if (imageUrls) {
            // Delete existing images
            await this.prisma.listingImage.deleteMany({
                where: { listingId: id },
            });

            // Create new images
            // We can't easily add to 'data' directly for nested writes in update like this without careful typing
            // So we'll do it separately or use a transaction if strict atomicity is needed.
            // For MVP, let's just re-create them.
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
