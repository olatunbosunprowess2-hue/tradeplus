import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { CounterOfferDto } from './dto/counter-offer.dto';
import { OfferQueryDto } from './dto/offer-query.dto';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BarterService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    async createOffer(userId: string, dto: CreateOfferDto) {
        // Validate target listing exists and allows barter
        const targetListing = await this.prisma.listing.findUnique({
            where: { id: dto.targetListingId },
            include: { seller: true },
        });

        if (!targetListing) {
            throw new NotFoundException('Target listing not found');
        }

        if (targetListing.sellerId === userId) {
            throw new BadRequestException('Cannot make offer on your own listing');
        }

        if (!targetListing.allowBarter && !targetListing.allowCashPlusBarter) {
            throw new BadRequestException('This listing does not accept barter offers');
        }

        // Validate offered items belong to user
        if (dto.offeredItems && dto.offeredItems.length > 0) {
            for (const item of dto.offeredItems) {
                const listing = await this.prisma.listing.findUnique({
                    where: { id: item.listingId },
                });

                if (!listing) {
                    throw new NotFoundException(`Offered listing ${item.listingId} not found`);
                }

                if (listing.sellerId !== userId) {
                    throw new ForbiddenException('You can only offer your own listings');
                }

                if (listing.quantity < item.quantity) {
                    throw new BadRequestException(
                        `Insufficient quantity for listing ${item.listingId}`,
                    );
                }
            }
        }

        // Create the offer
        const offer = await this.prisma.barterOffer.create({
            data: {
                listingId: dto.targetListingId,
                buyerId: userId,
                sellerId: targetListing.sellerId,
                currencyCode: targetListing.currencyCode,
                message: dto.message,
                offeredCashCents: dto.offeredCashCents ? BigInt(dto.offeredCashCents) : BigInt(0),
                items: dto.offeredItems
                    ? {
                        create: dto.offeredItems.map((item) => ({
                            offeredListingId: item.listingId,
                            quantity: item.quantity,
                        })),
                    }
                    : undefined,
            },
            include: {
                listing: {
                    include: {
                        seller: { include: { profile: true } },
                        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                    },
                },
                buyer: { include: { profile: true } },
                items: {
                    include: {
                        offeredListing: {
                            include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
                        },
                    },
                },
            },
        });

        // Send Notification
        await this.notificationsService.create(targetListing.sellerId, 'NEW_OFFER', {
            title: 'New Barter Offer',
            message: `You received an offer for ${targetListing.title}`,
            offerId: offer.id,
            listingId: targetListing.id,
        });

        return {
            ...offer,
            offeredCashCents: offer.offeredCashCents ? Number(offer.offeredCashCents) : 0,
        };
    }

    async getOffers(userId: string, query: OfferQueryDto) {
        const where: any = {};

        if (query.type === 'sent') {
            where.buyerId = userId;
        } else if (query.type === 'received') {
            where.sellerId = userId;
        } else {
            // Both sent and received
            where.OR = [
                { buyerId: userId },
                { sellerId: userId },
            ];
        }

        if (query.status) {
            where.status = query.status;
        }

        if (query.listingId) {
            where.listingId = query.listingId;
        }

        const offers = await this.prisma.barterOffer.findMany({
            where,
            include: {
                listing: {
                    include: {
                        seller: { include: { profile: true } },
                        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                    },
                },
                buyer: { include: { profile: true } },
                items: {
                    include: {
                        offeredListing: {
                            include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return offers.map((offer) => ({
            ...offer,
            offeredCashCents: offer.offeredCashCents ? Number(offer.offeredCashCents) : 0,
        }));
    }

    async getOffer(id: string, userId: string) {
        const offer = await this.prisma.barterOffer.findUnique({
            where: { id },
            include: {
                listing: {
                    include: {
                        seller: { include: { profile: true } },
                        images: { orderBy: { sortOrder: 'asc' } },
                    },
                },
                buyer: { include: { profile: true } },
                items: {
                    include: {
                        offeredListing: {
                            include: { images: { orderBy: { sortOrder: 'asc' } } },
                        },
                    },
                },
            },
        });

        if (!offer) {
            throw new NotFoundException('Offer not found');
        }

        // Verify user is involved in this offer
        if (offer.buyerId !== userId && offer.sellerId !== userId) {
            throw new ForbiddenException('You do not have access to this offer');
        }

        return {
            ...offer,
            offeredCashCents: offer.offeredCashCents ? Number(offer.offeredCashCents) : 0,
        };
    }

    async acceptOffer(id: string, userId: string) {
        const offer = await this.prisma.barterOffer.findUnique({
            where: { id },
        });

        if (!offer) {
            throw new NotFoundException('Offer not found');
        }

        if (offer.sellerId !== userId) {
            throw new ForbiddenException('Only the listing owner can accept offers');
        }

        if (offer.status !== 'pending') {
            throw new BadRequestException('Only pending offers can be accepted');
        }

        const updated = await this.prisma.barterOffer.update({
            where: { id },
            data: { status: 'accepted' },
            include: {
                listing: {
                    include: {
                        seller: { include: { profile: true } },
                        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                    },
                },
                buyer: { include: { profile: true } },
                items: {
                    include: {
                        offeredListing: {
                            include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
                        },
                    },
                },
            },
        });

        // Send Notification
        await this.notificationsService.create(updated.buyerId, 'OFFER_ACCEPTED', {
            title: 'Offer Accepted!',
            message: `Your offer for ${updated.listing.title} was accepted`,
            offerId: updated.id,
            listingId: updated.listingId,
        });

        return {
            ...updated,
            offeredCashCents: updated.offeredCashCents ? Number(updated.offeredCashCents) : 0,
        };
    }

    async rejectOffer(id: string, userId: string) {
        const offer = await this.prisma.barterOffer.findUnique({
            where: { id },
        });

        if (!offer) {
            throw new NotFoundException('Offer not found');
        }

        if (offer.sellerId !== userId) {
            throw new ForbiddenException('Only the listing owner can reject offers');
        }

        if (offer.status !== 'pending') {
            throw new BadRequestException('Only pending offers can be rejected');
        }

        const updated = await this.prisma.barterOffer.update({
            where: { id },
            data: { status: 'rejected' },
            include: {
                listing: {
                    include: {
                        seller: { include: { profile: true } },
                        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                    },
                },
                buyer: { include: { profile: true } },
                items: {
                    include: {
                        offeredListing: {
                            include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
                        },
                    },
                },
            },
        });

        // Send Notification
        await this.notificationsService.create(updated.buyerId, 'OFFER_REJECTED', {
            title: 'Offer Rejected',
            message: `Your offer for ${updated.listing.title} was rejected`,
            offerId: updated.id,
            listingId: updated.listingId,
        });

        return {
            ...updated,
            offeredCashCents: updated.offeredCashCents ? Number(updated.offeredCashCents) : 0,
        };
    }

    async counterOffer(id: string, userId: string, dto: CounterOfferDto) {
        const originalOffer = await this.prisma.barterOffer.findUnique({
            where: { id },
            include: { listing: true },
        });

        if (!originalOffer) {
            throw new NotFoundException('Original offer not found');
        }

        if (originalOffer.sellerId !== userId) {
            throw new ForbiddenException('Only the listing owner can make counter-offers');
        }

        if (originalOffer.status !== 'pending') {
            throw new BadRequestException('Can only counter pending offers');
        }

        // Validate counter-offered items belong to user
        if (dto.offeredItems && dto.offeredItems.length > 0) {
            for (const item of dto.offeredItems) {
                const listing = await this.prisma.listing.findUnique({
                    where: { id: item.listingId },
                });

                if (!listing || listing.sellerId !== userId) {
                    throw new ForbiddenException('You can only offer your own listings');
                }
            }
        }

        // Mark original offer as countered
        await this.prisma.barterOffer.update({
            where: { id },
            data: { status: 'countered' },
        });

        // Create new counter-offer (swap buyer and seller)
        const counterOffer = await this.prisma.barterOffer.create({
            data: {
                listingId: originalOffer.listingId,
                buyerId: userId, // Seller becomes buyer in counter-offer
                sellerId: originalOffer.buyerId, // Original buyer becomes seller
                currencyCode: originalOffer.currencyCode,
                message: dto.message,
                offeredCashCents: dto.offeredCashCents ? BigInt(dto.offeredCashCents) : BigInt(0),
                items: dto.offeredItems
                    ? {
                        create: dto.offeredItems.map((item) => ({
                            offeredListingId: item.listingId,
                            quantity: item.quantity,
                        })),
                    }
                    : undefined,
            },
            include: {
                listing: {
                    include: {
                        seller: { include: { profile: true } },
                        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                    },
                },
                buyer: { include: { profile: true } },
                items: {
                    include: {
                        offeredListing: {
                            include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
                        },
                    },
                },
            },
        });

        // Send Notification
        await this.notificationsService.create(originalOffer.buyerId, 'COUNTER_OFFER', {
            title: 'Counter Offer Received',
            message: `You received a counter-offer for ${originalOffer.listing.title}`,
            offerId: counterOffer.id,
            listingId: originalOffer.listingId,
        });

        return {
            ...counterOffer,
            offeredCashCents: counterOffer.offeredCashCents
                ? Number(counterOffer.offeredCashCents)
                : 0,
        };
    }
}
