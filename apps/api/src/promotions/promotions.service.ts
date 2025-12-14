import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto, PromotionPricingDto } from './dto/create-promotion.dto';

// Pricing in Nigerian Naira (kobo = cents)
const PROMOTION_PRICES = {
    homepage: { daily: 50000, weekly: 250000, monthly: 800000 }, // ₦500/day, ₦2,500/week, ₦8,000/month
    category: { daily: 30000, weekly: 150000, monthly: 500000 }, // ₦300/day, ₦1,500/week, ₦5,000/month  
    search: { daily: 20000, weekly: 100000, monthly: 350000 },   // ₦200/day, ₦1,000/week, ₦3,500/month
    all: { daily: 80000, weekly: 400000, monthly: 1200000 },     // ₦800/day, ₦4,000/week, ₦12,000/month
};

@Injectable()
export class PromotionsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get pricing for all promotion types
     */
    getPricing(): Record<string, PromotionPricingDto[]> {
        const pricing: Record<string, PromotionPricingDto[]> = {};

        for (const [placement, prices] of Object.entries(PROMOTION_PRICES)) {
            pricing[placement] = [
                { placement, durationDays: 1, priceCents: prices.daily, priceNaira: prices.daily / 100 },
                { placement, durationDays: 7, priceCents: prices.weekly, priceNaira: prices.weekly / 100 },
                { placement, durationDays: 30, priceCents: prices.monthly, priceNaira: prices.monthly / 100 },
            ];
        }

        return pricing;
    }

    /**
     * Calculate price for a promotion
     */
    calculatePrice(placement: string, durationDays: number): number {
        const prices = PROMOTION_PRICES[placement];
        if (!prices) throw new BadRequestException('Invalid placement type');

        // Calculate based on daily rate with discounts for longer durations
        if (durationDays >= 30) {
            return Math.ceil((durationDays / 30) * prices.monthly);
        } else if (durationDays >= 7) {
            return Math.ceil((durationDays / 7) * prices.weekly);
        } else {
            return durationDays * prices.daily;
        }
    }

    /**
     * Create a new promotion (mock payment for now)
     */
    async createPromotion(userId: string, dto: CreatePromotionDto) {
        // Verify listing exists and belongs to user
        const listing = await this.prisma.listing.findUnique({
            where: { id: dto.listingId },
        });

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        if (listing.sellerId !== userId) {
            throw new ForbiddenException('You can only promote your own listings');
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

        // Calculate price
        const priceCents = this.calculatePrice(dto.placement, dto.durationDays);

        // Create promotion
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + dto.durationDays);

        const promotion = await this.prisma.promotedListing.create({
            data: {
                listingId: dto.listingId,
                placement: dto.placement,
                startDate,
                endDate,
                durationDays: dto.durationDays,
                priceCents: BigInt(priceCents),
                status: 'active',
                createdById: userId,
            },
            include: {
                listing: {
                    select: {
                        id: true,
                        title: true,
                        images: { take: 1 },
                    },
                },
            },
        });

        // Also mark listing as featured if it's an 'all' or 'homepage' promotion
        if (dto.placement === 'all' || dto.placement === 'homepage') {
            await this.prisma.listing.update({
                where: { id: dto.listingId },
                data: { isFeatured: true },
            });
        }

        return {
            ...promotion,
            priceCents: Number(promotion.priceCents),
            priceNaira: Number(promotion.priceCents) / 100,
            message: `Promotion created! Your listing will be featured for ${dto.durationDays} days.`,
        };
    }

    /**
     * Get user's promotions
     */
    async getUserPromotions(userId: string) {
        const promotions = await this.prisma.promotedListing.findMany({
            where: { createdById: userId },
            include: {
                listing: {
                    select: {
                        id: true,
                        title: true,
                        images: { take: 1 },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return promotions.map(p => ({
            ...p,
            priceCents: Number(p.priceCents),
            priceNaira: Number(p.priceCents) / 100,
            isActive: p.status === 'active' && new Date(p.endDate) > new Date(),
        }));
    }

    /**
     * Get all active promoted listings (for frontend to display)
     */
    async getPromotedListings(placement?: string) {
        const where: any = {
            status: 'active',
            endDate: { gt: new Date() },
        };

        if (placement) {
            where.OR = [
                { placement },
                { placement: 'all' },
            ];
        }

        const promotions = await this.prisma.promotedListing.findMany({
            where,
            include: {
                listing: {
                    include: {
                        images: true,
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

        return promotions.map(p => p.listing);
    }

    /**
     * Cancel a promotion (admin or owner)
     */
    async cancelPromotion(promotionId: string, userId: string, isAdmin: boolean) {
        const promotion = await this.prisma.promotedListing.findUnique({
            where: { id: promotionId },
        });

        if (!promotion) {
            throw new NotFoundException('Promotion not found');
        }

        if (!isAdmin && promotion.createdById !== userId) {
            throw new ForbiddenException('You can only cancel your own promotions');
        }

        return this.prisma.promotedListing.update({
            where: { id: promotionId },
            data: { status: 'cancelled' },
        });
    }

    /**
     * Expire old promotions (called by cron job)
     */
    async expirePromotions() {
        const result = await this.prisma.promotedListing.updateMany({
            where: {
                status: 'active',
                endDate: { lt: new Date() },
            },
            data: { status: 'expired' },
        });

        // Also unflag listings that no longer have active promotions
        const expiredListingIds = await this.prisma.promotedListing.findMany({
            where: { status: 'expired' },
            select: { listingId: true },
        });

        for (const { listingId } of expiredListingIds) {
            const hasActivePromotion = await this.prisma.promotedListing.findFirst({
                where: {
                    listingId,
                    status: 'active',
                    endDate: { gt: new Date() },
                },
            });

            if (!hasActivePromotion) {
                await this.prisma.listing.update({
                    where: { id: listingId },
                    data: { isFeatured: false },
                });
            }
        }

        return { expired: result.count };
    }
}
