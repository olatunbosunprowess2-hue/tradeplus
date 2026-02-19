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
        const expiredOffers = await this.prisma.barterOffer.findMany({
            where: {
                status: 'accepted',
                timerExpiresAt: { lt: now },
                timerPausedAt: null, // Only cancel if NOT paused (e.g., waiting for seller confirmation)
            },
            include: {
                listing: true,
                items: { include: { offeredListing: true } },
                buyer: { include: { profile: true } },
                seller: { include: { profile: true } },
            },
        });

        if (expiredOffers.length === 0) return;

        this.logger.log(`Found ${expiredOffers.length} expired trades. Processing cancellation...`);

        for (const offer of expiredOffers) {
            try {
                await this.prisma.$transaction(async (tx) => {
                    // 2. Mark offer as cancelled (or 'expired')
                    // We'll use 'cancelled' for now to fit existing logic
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
                                senderId: offer.sellerId, // Could be system, but seller works as the one who "timer expired"
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
    }
}
