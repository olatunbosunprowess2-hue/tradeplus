import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

interface PromoteListingDto {
    listingId: string;
    placement: 'homepage' | 'category' | 'search' | 'all';
    durationDays: 1 | 3 | 7;
}

// Pricing in cents (NGN)
const PROMOTION_PRICING: Record<number, Record<string, number>> = {
    1: { homepage: 500000, category: 300000, search: 200000, all: 800000 }, // 1 day
    3: { homepage: 1200000, category: 700000, search: 450000, all: 1800000 }, // 3 days
    7: { homepage: 2500000, category: 1500000, search: 900000, all: 4000000 }, // 7 days
};

@Injectable()
export class PromotedListingsService {
    private readonly logger = new Logger(PromotedListingsService.name);

    constructor(
        private prisma: PrismaService,
        private audit: AuditService,
    ) { }

    /**
     * Calculate promotion price
     */
    calculatePrice(durationDays: number, placement: string): number {
        const dayPricing = PROMOTION_PRICING[durationDays];
        if (!dayPricing) {
            throw new BadRequestException('Invalid duration. Use 1, 3, or 7 days.');
        }
        const price = dayPricing[placement];
        if (!price) {
            throw new BadRequestException('Invalid placement. Use homepage, category, search, or all.');
        }
        return price;
    }

    /**
     * Promote a listing
     */
    async promoteListing(dto: PromoteListingDto, adminId: string) {
        // Validate listing exists
        const listing = await this.prisma.listing.findUnique({
            where: { id: dto.listingId },
        });

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        if (listing.status !== 'active') {
            throw new BadRequestException('Can only promote active listings');
        }

        // Check for existing active promotion
        const existingPromotion = await this.prisma.promotedListing.findFirst({
            where: {
                listingId: dto.listingId,
                status: 'active',
                endDate: { gt: new Date() },
            },
        });

        if (existingPromotion) {
            throw new BadRequestException('This listing already has an active promotion');
        }

        // Calculate dates and price
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + dto.durationDays * 24 * 60 * 60 * 1000);
        const priceCents = this.calculatePrice(dto.durationDays, dto.placement);

        // Create promotion
        const promotion = await this.prisma.promotedListing.create({
            data: {
                listingId: dto.listingId,
                placement: dto.placement,
                startDate,
                endDate,
                durationDays: dto.durationDays,
                priceCents: BigInt(priceCents),
                status: 'active',
                createdById: adminId,
            },
            include: {
                listing: {
                    select: { title: true },
                },
            },
        });

        // Update listing's isFeatured flag
        await this.prisma.listing.update({
            where: { id: dto.listingId },
            data: { isFeatured: true },
        });

        // Audit log
        await this.audit.log(
            adminId,
            'LISTING_PROMOTED',
            undefined,
            {
                listingId: dto.listingId,
                listingTitle: promotion.listing.title,
                placement: dto.placement,
                durationDays: dto.durationDays,
                priceCents,
            }
        );

        return {
            id: promotion.id,
            listingId: promotion.listingId,
            listingTitle: promotion.listing.title,
            placement: promotion.placement,
            startDate: promotion.startDate,
            endDate: promotion.endDate,
            priceCents: Number(promotion.priceCents),
            status: promotion.status,
        };
    }

    /**
     * Get active promotions
     */
    async getActivePromotions() {
        const promotions = await this.prisma.promotedListing.findMany({
            where: {
                status: 'active',
                endDate: { gt: new Date() },
            },
            include: {
                listing: {
                    select: {
                        id: true,
                        title: true,
                        views: true,
                        seller: {
                            select: {
                                email: true,
                                profile: { select: { displayName: true } },
                            },
                        },
                    },
                },
                createdBy: {
                    select: {
                        email: true,
                        profile: { select: { displayName: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return promotions.map(p => ({
            id: p.id,
            listingId: p.listingId,
            listingTitle: p.listing.title,
            listingViews: Number(p.listing.views),
            sellerName: p.listing.seller.profile?.displayName || p.listing.seller.email,
            placement: p.placement,
            startDate: p.startDate,
            endDate: p.endDate,
            durationDays: p.durationDays,
            priceCents: Number(p.priceCents),
            status: p.status,
            promotedBy: p.createdBy.profile?.displayName || p.createdBy.email,
            createdAt: p.createdAt,
        }));
    }

    /**
     * Cancel a promotion
     */
    async cancelPromotion(promotionId: string, adminId: string) {
        const promotion = await this.prisma.promotedListing.findUnique({
            where: { id: promotionId },
            include: { listing: { select: { title: true } } },
        });

        if (!promotion) {
            throw new NotFoundException('Promotion not found');
        }

        if (promotion.status !== 'active') {
            throw new BadRequestException('Can only cancel active promotions');
        }

        await this.prisma.promotedListing.update({
            where: { id: promotionId },
            data: { status: 'cancelled' },
        });

        // Check if there are any other active promotions for this listing
        const otherActive = await this.prisma.promotedListing.count({
            where: {
                listingId: promotion.listingId,
                status: 'active',
                id: { not: promotionId },
            },
        });

        // If no other active promotions, remove featured flag
        if (otherActive === 0) {
            await this.prisma.listing.update({
                where: { id: promotion.listingId },
                data: { isFeatured: false },
            });
        }

        await this.audit.log(adminId, 'PROMOTION_CANCELLED', undefined, {
            promotionId,
            listingId: promotion.listingId,
            listingTitle: promotion.listing.title,
        });

        return { success: true };
    }

    /**
     * Get promoted listings for a specific placement (for frontend display)
     */
    async getPromotedListingsForPlacement(placement: string) {
        const promotions = await this.prisma.promotedListing.findMany({
            where: {
                status: 'active',
                endDate: { gt: new Date() },
                OR: [
                    { placement },
                    { placement: 'all' },
                ],
            },
            include: {
                listing: {
                    include: {
                        images: { take: 1 },
                        seller: {
                            select: {
                                id: true,
                                profile: { select: { displayName: true, avatarUrl: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return promotions.map(p => ({
            ...p.listing,
            priceCents: p.listing.priceCents ? Number(p.listing.priceCents) : 0,
            isPromoted: true,
            promotionPlacement: p.placement,
        }));
    }

    /**
     * CRON: Auto-expire promotions that have ended
     */
    @Cron('0 * * * *') // Every hour
    async expirePromotions() {
        this.logger.log('Checking for expired promotions...');

        const expired = await this.prisma.promotedListing.findMany({
            where: {
                status: 'active',
                endDate: { lte: new Date() },
            },
            select: { id: true, listingId: true },
        });

        if (expired.length === 0) {
            this.logger.log('No promotions to expire');
            return;
        }

        // Update expired promotions
        await this.prisma.promotedListing.updateMany({
            where: { id: { in: expired.map(e => e.id) } },
            data: { status: 'expired' },
        });

        // Update isFeatured for listings with no more active promotions
        for (const promo of expired) {
            const otherActive = await this.prisma.promotedListing.count({
                where: {
                    listingId: promo.listingId,
                    status: 'active',
                    id: { not: promo.id },
                },
            });

            if (otherActive === 0) {
                await this.prisma.listing.update({
                    where: { id: promo.listingId },
                    data: { isFeatured: false },
                });
            }
        }

        this.logger.log(`Expired ${expired.length} promotions`);
    }
}
