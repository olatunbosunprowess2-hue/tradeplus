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
import { EmailService } from '../email/email.service';

@Injectable()
export class BarterService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
        private emailService: EmailService,
    ) { }

    async createOffer(userId: string, dto: CreateOfferDto) {
        // Validate target listing exists and allows barter
        const targetListing = await this.prisma.listing.findUnique({
            where: { id: dto.targetListingId },
            include: { seller: { include: { profile: true } } },
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

        // Check if user has already made 2 or more offers for this listing
        const existingOffersCount = await this.prisma.barterOffer.count({
            where: {
                listingId: dto.targetListingId,
                buyerId: userId,
            },
        });

        if (existingOffersCount >= 2) {
            throw new BadRequestException('You have already made the maximum number of offers (2) for this listing');
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

        // Send Email (async, don't block)
        const offerDetails = dto.offeredCashCents
            ? `Cash offer: ₦${(dto.offeredCashCents / 100).toLocaleString()}`
            : `Barter offer with ${dto.offeredItems?.length || 0} item(s)`;
        this.emailService.sendNewOffer(
            targetListing.seller.email,
            targetListing.seller.profile?.displayName || '',
            offer.buyer.profile?.displayName || offer.buyer.email,
            targetListing.title,
            offerDetails,
        );

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
                seller: { include: { profile: true } },
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
            include: {
                listing: true,
                buyer: { include: { profile: true } },
            },
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

        // Create or find conversation for this trade
        let conversation = await this.prisma.conversation.findFirst({
            where: {
                OR: [
                    { buyerId: offer.buyerId, sellerId: userId, listingId: offer.listingId },
                    { buyerId: userId, sellerId: offer.buyerId, listingId: offer.listingId },
                ],
            },
        });

        if (!conversation) {
            conversation = await this.prisma.conversation.create({
                data: {
                    buyerId: offer.buyerId,
                    sellerId: userId,
                    listingId: offer.listingId,
                    barterOfferId: offer.id,
                },
            });
        } else {
            // Link existing conversation to this offer if not already
            if (!conversation.barterOfferId) {
                await this.prisma.conversation.update({
                    where: { id: conversation.id },
                    data: { barterOfferId: offer.id },
                });
            }
        }

        // Create system message for trade acceptance
        await this.prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId: userId,
                body: `🎉 Offer accepted! You can now chat to arrange the exchange for "${offer.listing.title}".`,
                messageType: 'system',
            },
        });

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

        // Send Notification with conversation link
        await this.notificationsService.create(updated.buyerId, 'OFFER_ACCEPTED', {
            title: 'Offer Accepted! 🎉',
            message: `Your offer for ${updated.listing.title} was accepted! Start chatting now.`,
            offerId: updated.id,
            listingId: updated.listingId,
            conversationId: conversation.id,
        });

        // Send Email (async)
        this.emailService.sendOfferAccepted(
            updated.buyer.email,
            updated.buyer.profile?.displayName || '',
            updated.listing.seller.profile?.displayName || updated.listing.seller.email,
            updated.listing.title,
        );

        return {
            ...updated,
            offeredCashCents: updated.offeredCashCents ? Number(updated.offeredCashCents) : 0,
            conversationId: conversation.id, // Return for frontend navigation
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

        // Send Email (async)
        this.emailService.sendOfferRejected(
            updated.buyer.email,
            updated.buyer.profile?.displayName || '',
            updated.listing.title,
        );

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

        // Send Email (async)
        const counterDetails = dto.offeredCashCents
            ? `Counter offer: ₦${(dto.offeredCashCents / 100).toLocaleString()}`
            : `Counter offer with ${dto.offeredItems?.length || 0} item(s)`;
        this.emailService.sendCounterOffer(
            counterOffer.buyer.email,
            counterOffer.buyer.profile?.displayName || '',
            counterOffer.listing.seller.profile?.displayName || counterOffer.listing.seller.email,
            originalOffer.listing.title,
            counterDetails,
        );

        return {
            ...counterOffer,
            offeredCashCents: counterOffer.offeredCashCents
                ? Number(counterOffer.offeredCashCents)
                : 0,
        };
    }

    async confirmTrade(offerId: string, userId: string) {
        const offer = await this.prisma.barterOffer.findUnique({
            where: { id: offerId },
        });

        if (!offer) {
            throw new NotFoundException('Offer not found');
        }

        if (offer.status !== 'accepted') {
            throw new BadRequestException('Only accepted offers can be confirmed');
        }

        const isSeller = offer.sellerId === userId;
        const isBuyer = offer.buyerId === userId;

        if (!isSeller && !isBuyer) {
            throw new ForbiddenException('You are not involved in this trade');
        }

        const updateData: any = {};

        if (isSeller) {
            updateData.listingOwnerConfirmedAt = new Date();
        } else {
            updateData.offerMakerConfirmedAt = new Date();
        }

        // Check if the OTHER party has already confirmed
        const otherConfirmed = isSeller
            ? offer.offerMakerConfirmedAt
            : offer.listingOwnerConfirmedAt;

        if (otherConfirmed) {
            // Both have now confirmed. Set receipt availability to 24 hours from now.
            const now = new Date();
            const receiptAvailableAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hours
            updateData.receiptAvailableAt = receiptAvailableAt;
        }

        const updated = await this.prisma.barterOffer.update({
            where: { id: offerId },
            data: updateData,
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

        return {
            ...updated,
            offeredCashCents: updated.offeredCashCents ? Number(updated.offeredCashCents) : 0,
        };
    }

    async getReceipt(offerId: string, userId: string) {
        const offer = await this.prisma.barterOffer.findUnique({
            where: { id: offerId },
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

        if (!offer) {
            throw new NotFoundException('Offer not found');
        }

        if (offer.buyerId !== userId && offer.sellerId !== userId) {
            throw new ForbiddenException('You are not involved in this trade');
        }

        // Check eligibility
        if (!offer.receiptAvailableAt) {
            throw new BadRequestException('Receipt is not yet available. Both parties must confirm receipt first.');
        }

        if (new Date() < offer.receiptAvailableAt) {
            const remaining = Math.ceil((offer.receiptAvailableAt.getTime() - new Date().getTime()) / (1000 * 60 * 60));
            throw new BadRequestException(`Receipt will be available in approximately ${remaining} hours.`);
        }

        if (offer.disputeStatus !== 'none') {
            throw new BadRequestException('Cannot generate receipt while a dispute is active.');
        }

        // Generate Receipt Number if not exists
        if (!offer.receiptNumber) {
            const receiptNumber = `BW-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

            const updated = await this.prisma.barterOffer.update({
                where: { id: offerId },
                data: {
                    receiptNumber,
                    receiptGeneratedAt: new Date(),
                },
            });
            offer.receiptNumber = updated.receiptNumber;
            offer.receiptGeneratedAt = updated.receiptGeneratedAt;
        }

        return {
            ...offer,
            offeredCashCents: offer.offeredCashCents ? Number(offer.offeredCashCents) : 0,
        };
    }
}
