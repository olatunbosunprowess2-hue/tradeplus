import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TradeExpirationService {
    private readonly logger = new Logger(TradeExpirationService.name);

    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleExpiredTrades() {
        const now = new Date();

        // 1. Find accepted trades where timer has expired and not paused
        // CRITICAL: Never auto-cancel trades where downpayment has been confirmed
        const expiredOffers = await this.prisma.barterOffer.findMany({
            where: {
                status: 'accepted',
                timerExpiresAt: { lt: now },
                timerPausedAt: null, // Only cancel if NOT paused (e.g., waiting for seller confirmation)
                downpaymentStatus: { not: 'confirmed' }, // NEVER cancel a paid trade
            },
            include: {
                listing: true,
                items: { include: { offeredListing: true } },
                buyer: { include: { profile: true } },
                seller: { include: { profile: true } },
            },
        });

        if (expiredOffers.length > 0) {
            this.logger.log(`Found ${expiredOffers.length} expired anti-ghosting trades. Processing cancellation...`);
        }

        for (const offer of expiredOffers) {
            try {
                await this.prisma.$transaction(async (tx) => {
                    // 2. Mark offer as cancelled
                    await tx.barterOffer.update({
                        where: { id: offer.id },
                        data: { status: 'cancelled' },
                    });

                    // 3. Create a system message in the conversation
                    const conversation = await tx.conversation.findFirst({
                        where: { barterOfferId: offer.id },
                    });

                    if (conversation) {
                        await tx.message.create({
                            data: {
                                conversationId: conversation.id,
                                senderId: offer.sellerId,
                                body: '🛑 This trade has been automatically cancelled because the timer expired before completion.',
                                messageType: 'system',
                            },
                        });
                    }

                    // 4. Notifications
                    await this.notificationsService.create(offer.buyerId, 'TRADE_EXPIRED', {
                        title: 'Trade Expired ⏰',
                        message: `The trade for "${offer.listing.title}" has expired and was cancelled.`,
                        offerId: offer.id,
                    });

                    await this.notificationsService.create(offer.sellerId, 'TRADE_EXPIRED', {
                        title: 'Trade Expired ⏰',
                        message: `The trade for "${offer.listing.title}" has expired and items have been released.`,
                        offerId: offer.id,
                    });
                });

                this.logger.log(`Successfully cancelled expired trade ${offer.id}`);
            } catch (error) {
                this.logger.error(`Failed to cancel expired trade ${offer.id}: ${error.message}`);
            }
        }

        // 2B. Handle AWAITING_MEETUP trades where 7-day meetup deadline has expired
        // These trades have confirmed downpayments — NEVER cancel, escalate to DISPUTE
        const expiredMeetups = await this.prisma.barterOffer.findMany({
            where: {
                status: 'awaiting_meetup',
                timerExpiresAt: { lt: now },
                timerPausedAt: null,
            },
            include: {
                listing: true,
                buyer: { include: { profile: true } },
                seller: { include: { profile: true } },
            },
        });

        for (const offer of expiredMeetups) {
            try {
                await this.prisma.$transaction(async (tx) => {
                    // Escalate to dispute — admin must review
                    await tx.barterOffer.update({
                        where: { id: offer.id },
                        data: {
                            disputeStatus: 'opened',
                            status: 'dispute',
                        },
                    });

                    const conversation = await tx.conversation.findFirst({
                        where: { barterOfferId: offer.id },
                    });

                    if (conversation) {
                        await tx.message.create({
                            data: {
                                conversationId: conversation.id,
                                senderId: offer.sellerId,
                                body: '⚠️ The 7-day meetup deadline has passed without a final handshake. This trade has been escalated for admin review. A downpayment was already confirmed so the trade cannot be auto-cancelled. Please contact support if you need assistance.',
                                messageType: 'system',
                            },
                        });
                    }

                    await this.notificationsService.create(offer.buyerId, 'MEETUP_EXPIRED', {
                        title: 'Meetup Deadline Passed ⚠️',
                        message: `The 7-day meetup window for "${offer.listing.title}" has expired. The trade is under review.`,
                        offerId: offer.id,
                    });

                    await this.notificationsService.create(offer.sellerId, 'MEETUP_EXPIRED', {
                        title: 'Meetup Deadline Passed ⚠️',
                        message: `The 7-day meetup window for "${offer.listing.title}" has expired. The trade is under review.`,
                        offerId: offer.id,
                    });
                });

                this.logger.log(`Escalated expired meetup trade ${offer.id} to dispute`);
            } catch (error) {
                this.logger.error(`Failed to escalate expired meetup ${offer.id}: ${error.message}`);
            }
        }

        // 5. Send "Hurry Up" notification at 10 minutes remaining
        const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
        const warningOffers = await this.prisma.barterOffer.findMany({
            where: {
                status: 'accepted',
                timerExpiresAt: { lte: tenMinutesFromNow, gt: now },
                timerPausedAt: null,
                timerWarned10Min: false,
            },
            include: { listing: true },
        });

        for (const offer of warningOffers) {
            try {
                await this.prisma.barterOffer.update({
                    where: { id: offer.id },
                    data: { timerWarned10Min: true },
                });

                await this.notificationsService.create(offer.buyerId, 'TIMER_WARNING', {
                    title: '⏰ 10 minutes left!',
                    message: `Hurry! Only 10 minutes left to secure your deal for "${offer.listing.title}". Pay or request an extension.`,
                    offerId: offer.id,
                    listingId: offer.listingId,
                });
            } catch (error) {
                this.logger.error(`Failed to send timer warning for ${offer.id}: ${error.message}`);
            }
        }
    }
}
