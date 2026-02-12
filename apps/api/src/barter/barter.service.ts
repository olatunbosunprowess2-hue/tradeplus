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

        // Validate Downpayment (Verified Brand Requirement)
        if (targetListing.downpaymentCents && targetListing.downpaymentCents > BigInt(0)) {
            const offeredCash = dto.offeredCashCents ? BigInt(Math.round(dto.offeredCashCents)) : BigInt(0);
            if (offeredCash < targetListing.downpaymentCents) {
                const requiredAmount = Number(targetListing.downpaymentCents) / 100;
                throw new BadRequestException(
                    `This listing requires a minimum downpayment of ${targetListing.currencyCode} ${requiredAmount.toLocaleString()}. Your cash offer must meet this amount.`
                );
            }
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

                if (listing.status !== 'active') {
                    throw new BadRequestException(`Listing ${listing.title} is not active and cannot be offered`);
                }

                // Check "In-Trade" quantity: listing.quantity minus quantities already committed in PENDING or ACCEPTED offers
                const committedQuantity = await this.prisma.barterOfferItem.aggregate({
                    where: {
                        offeredListingId: item.listingId,
                        barterOffer: {
                            buyerId: userId,
                            status: { in: ['pending', 'accepted'] },
                        },
                    },
                    _sum: {
                        quantity: true,
                    },
                });

                const totalCommitted = (committedQuantity._sum.quantity || 0);
                const availableQuantity = listing.quantity - totalCommitted;

                if (availableQuantity < item.quantity) {
                    throw new BadRequestException(
                        `Insufficient available quantity for ${listing.title}. You have ${listing.quantity} total, but ${totalCommitted} units are already committed in other pending/accepted offers.`,
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
                seller: { include: { profile: true } },
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
                seller: { include: { profile: true } },
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
            data: {
                status: 'accepted',
                // If listing has a downpayment, start the downpayment flow
                ...(offer.listing.downpaymentCents && Number(offer.listing.downpaymentCents) > 0
                    ? { downpaymentStatus: 'awaiting_payment' }
                    : {}),
            },
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

        // Revalidate other pending offers involving these items
        if (updated.items && updated.items.length > 0) {
            for (const item of updated.items) {
                await this.validateInTradeQuantities(item.offeredListingId, updated.buyerId);
            }
        }

        return {
            ...updated,
            offeredCashCents: updated.offeredCashCents ? Number(updated.offeredCashCents) : 0,
            conversationId: conversation.id, // Return for frontend navigation
        };
    }

    /**
     * Revalidates all pending offers that include a specific listing.
     * If a pending offer now exceeds the available quantity (listing.quantity - other committed),
     * it is automatically cancelled.
     */
    async validateInTradeQuantities(listingId: string, sellerId: string) {
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId },
        });

        if (!listing) return;

        // 1. Handle offers where this listing is the TARGET (listingId matches BarterOffer.listingId)
        if (listing.status !== 'active') {
            const offersForListing = await this.prisma.barterOffer.findMany({
                where: {
                    listingId: listing.id,
                    status: 'pending',
                },
            });

            for (const offer of offersForListing) {
                await this.prisma.barterOffer.update({
                    where: { id: offer.id },
                    data: { status: 'cancelled' },
                });

                await this.notificationsService.create(offer.buyerId, 'OFFER_CANCELLED', {
                    title: 'Offer Cancelled',
                    message: `Your offer for "${listing.title}" was automatically cancelled because the listing is no longer available.`,
                    offerId: offer.id,
                    listingId: offer.listingId,
                });
            }
        }

        // 2. Handle offers where this listing is being OFFERED as barter (listingId in BarterOfferItem)
        const pendingOffersUsingItem = await this.prisma.barterOffer.findMany({
            where: {
                status: 'pending',
                items: {
                    some: { offeredListingId: listingId },
                },
            },
            include: {
                items: true,
                buyer: { include: { profile: true } },
                listing: true,
            },
        });

        for (const offer of pendingOffersUsingItem) {
            const offeredItem = offer.items.find(i => i.offeredListingId === listingId);
            if (!offeredItem) continue;

            // Calculate total committed quantity for this user and this listing (excluding current offer)
            const committedQuantity = await this.prisma.barterOfferItem.aggregate({
                where: {
                    offeredListingId: listingId,
                    barterOffer: {
                        id: { not: offer.id },
                        buyerId: offer.buyerId,
                        status: { in: ['pending', 'accepted'] },
                    },
                },
                _sum: {
                    quantity: true,
                },
            });

            const totalOtherCommitted = (committedQuantity._sum.quantity || 0);
            const remainingAvailable = listing.quantity - totalOtherCommitted;

            // If the listing is no longer active, or requested quantity exceeds remaining available
            if (listing.status !== 'active' || remainingAvailable < offeredItem.quantity) {
                // Auto-cancel this offer
                await this.prisma.barterOffer.update({
                    where: { id: offer.id },
                    data: { status: 'cancelled' },
                });

                // Notify the buyer
                const reason = listing.status !== 'active'
                    ? `Item "${listing.title}" is no longer available.`
                    : `You no longer have sufficient quantity of "${listing.title}" available for this trade.`;

                await this.notificationsService.create(offer.buyerId, 'OFFER_CANCELLED', {
                    title: 'Offer Auto-Cancelled',
                    message: `Your offer for "${offer.listing.title}" was automatically cancelled. Reason: ${reason}`,
                    offerId: offer.id,
                    listingId: offer.listingId,
                });
            }
        }
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
                seller: { include: { profile: true } },
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

                if (listing.status !== 'active') {
                    throw new BadRequestException(`Listing ${listing.title} is not active and cannot be offered`);
                }

                // Check "In-Trade" quantity for counter-offer
                const committedQuantity = await this.prisma.barterOfferItem.aggregate({
                    where: {
                        offeredListingId: item.listingId,
                        barterOffer: {
                            buyerId: userId,
                            status: { in: ['pending', 'accepted'] },
                        },
                    },
                    _sum: {
                        quantity: true,
                    },
                });

                const totalCommitted = (committedQuantity._sum.quantity || 0);
                const availableQuantity = listing.quantity - totalCommitted;

                if (availableQuantity < item.quantity) {
                    throw new BadRequestException(
                        `Insufficient available quantity for ${listing.title}. You have ${listing.quantity} total, but ${totalCommitted} units are already committed in other pending/accepted offers.`,
                    );
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
                seller: { include: { profile: true } },
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
            include: { items: true },
        });


        if (!offer) {
            throw new NotFoundException('Offer not found');
        }

        const validOffer = offer;

        if (validOffer.status !== 'accepted') {

            throw new BadRequestException('Only accepted offers can be confirmed');
        }

        const isSeller = validOffer.sellerId === userId;
        const isBuyer = validOffer.buyerId === userId;


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

            // Atomic quantity reduction and status updates using a transaction
            return await this.prisma.$transaction(async (tx) => {
                const updatedOffer = await tx.barterOffer.update({
                    where: { id: offerId },
                    data: updateData,
                    include: {
                        listing: true,
                        items: {
                            include: { offeredListing: true }
                        },
                        buyer: { include: { profile: true } },
                        seller: { include: { profile: true } },
                    },
                });

                // 1. Update target listing (the one the offer was made for)
                // Note: For now we assume quantity 1 for the main listing in a swap, 
                // but we should ideally handle quantity if the model supports it per trade.
                // Looking at schema, BarterOffer doesn't have a quantity field directly, 
                // it's an offer for the whole listing (or 1 unit of it).
                // Let's assume 1 unit for the main listing.
                const newTargetQuantity = Math.max(0, updatedOffer.listing.quantity - 1);
                await tx.listing.update({
                    where: { id: updatedOffer.listingId },
                    data: {
                        quantity: newTargetQuantity,
                        status: newTargetQuantity === 0 ? 'sold' : updatedOffer.listing.status
                    }
                });

                // 2. Update offered listings
                for (const item of updatedOffer.items) {
                    const newOfferedQuantity = Math.max(0, item.offeredListing.quantity - item.quantity);
                    await tx.listing.update({
                        where: { id: item.offeredListingId },
                        data: {
                            quantity: newOfferedQuantity,
                            status: newOfferedQuantity === 0 ? 'sold' : item.offeredListing.status
                        }
                    });
                }

                // 3. Revalidate other pending offers since quantities changed
            });

            // Revalidate outside transaction to avoid potential deadlocks/wait
            await this.validateInTradeQuantities(validOffer.listingId, validOffer.sellerId);
            if (validOffer.items) {
                for (const item of validOffer.items) {
                    await this.validateInTradeQuantities(item.offeredListingId, validOffer.buyerId);
                }
            }




            // Fetch the final state to return
            return this.getOffer(offerId, userId);
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
                seller: { include: { profile: true } },
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
                seller: { include: { profile: true } },
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

    // =====================
    // DOWNPAYMENT TRACKING
    // =====================

    async markDownpaymentPaid(offerId: string, userId: string) {
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
                seller: { include: { profile: true } },
            },
        });

        if (!offer) {
            throw new NotFoundException('Offer not found');
        }

        if (offer.buyerId !== userId) {
            throw new ForbiddenException('Only the buyer can mark a downpayment as paid');
        }

        if (offer.status !== 'accepted') {
            throw new BadRequestException('Offer must be accepted before marking payment');
        }

        if (offer.downpaymentStatus !== 'awaiting_payment') {
            throw new BadRequestException(`Downpayment is currently '${offer.downpaymentStatus}', expected 'awaiting_payment'`);
        }

        const updated = await this.prisma.barterOffer.update({
            where: { id: offerId },
            data: {
                downpaymentStatus: 'paid',
                downpaymentPaidAt: new Date(),
            },
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
        });

        // Notify seller that buyer marked payment as sent
        await this.notificationsService.create(updated.sellerId, 'DOWNPAYMENT_PAID', {
            title: 'Downpayment Sent 💰',
            message: `${updated.buyer?.profile?.displayName || updated.buyer?.email || 'Buyer'} has marked the downpayment as paid for "${updated.listing.title}". Please confirm receipt.`,
            offerId: updated.id,
            listingId: updated.listingId,
        });

        return {
            ...updated,
            offeredCashCents: updated.offeredCashCents ? Number(updated.offeredCashCents) : 0,
        };
    }

    async confirmDownpaymentReceipt(offerId: string, userId: string) {
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
                seller: { include: { profile: true } },
            },
        });

        if (!offer) {
            throw new NotFoundException('Offer not found');
        }

        if (offer.sellerId !== userId) {
            throw new ForbiddenException('Only the seller can confirm downpayment receipt');
        }

        if (offer.status !== 'accepted') {
            throw new BadRequestException('Offer must be accepted before confirming receipt');
        }

        if (offer.downpaymentStatus !== 'paid') {
            throw new BadRequestException(`Downpayment is currently '${offer.downpaymentStatus}', expected 'paid'`);
        }

        const updated = await this.prisma.barterOffer.update({
            where: { id: offerId },
            data: {
                downpaymentStatus: 'confirmed',
                downpaymentConfirmedAt: new Date(),
            },
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
        });

        // Notify buyer that seller confirmed receipt
        await this.notificationsService.create(updated.buyerId, 'DOWNPAYMENT_CONFIRMED', {
            title: 'Downpayment Confirmed ✅',
            message: `${updated.seller?.profile?.displayName || updated.seller?.email || 'Seller'} has confirmed receiving your downpayment for "${updated.listing.title}".`,
            offerId: updated.id,
            listingId: updated.listingId,
        });

        return {
            ...updated,
            offeredCashCents: updated.offeredCashCents ? Number(updated.offeredCashCents) : 0,
        };
    }
}
