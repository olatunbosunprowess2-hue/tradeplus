import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityGateway } from '../activity/activity.gateway';
import { MessagesService } from '../messages/messages.service';


@Injectable()
export class NotificationsService {
    constructor(
        private prisma: PrismaService,
        private gateway: ActivityGateway,
        @Inject(forwardRef(() => MessagesService))
        private messagesService: MessagesService
    ) { }


    async findAll(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getUnreadCount(userId: string) {
        // 1. Get raw notification counts
        const notifications = await this.prisma.notification.findMany({
            where: {
                userId,
                readAt: null,
            },
            select: { type: true }
        });

        // 2. Calculate category counts from notifications table
        let offersCount = 0;
        let systemCount = 0;

        const offerTypes = ['NEW_OFFER', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'OFFER_COUNTERED', 'offer'];
        // All other types go to system (or other categories if we add them later)

        for (const n of notifications) {
            if (offerTypes.includes(n.type)) {
                offersCount++;
            } else if (n.type !== 'message' && n.type !== 'NEW_MESSAGE') {
                // Exclude message notifications from system count to avoid double counting
                // (Messages are counted from Message table)
                systemCount++;
            }
        }

        // 3. Get true unread messages count from Messages table
        let messagesCount = 0;
        try {
            messagesCount = await this.messagesService.getUnreadMessageCount(userId);
        } catch (error) {
            console.error('Failed to fetch message count in notifications service:', error);
        }

        return {
            total: messagesCount + offersCount + systemCount,
            messages: messagesCount,
            offers: offersCount,
            system: systemCount
        };
    }

    async markAsRead(userId: string, notificationId: string) {
        return this.prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId,
            },
            data: {
                readAt: new Date(),
            },
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: {
                userId,
                readAt: null,
            },
            data: {
                readAt: new Date(),
            },
        });
    }

    // Internal method to create notifications
    async create(userId: string, type: string, data: any) {
        const notification = await this.prisma.notification.create({
            data: {
                userId,
                type,
                data,
            },
        });

        // Real-time broadcast
        this.gateway.sendToUser(userId, 'NEW_NOTIFICATION', notification);

        return notification;
    }

    /**
     * Create notifications for multiple users (for boost notifications)
     */
    async createBulkNotifications(userIds: string[], type: string, data: any): Promise<number> {
        if (userIds.length === 0) return 0;

        // Create notifications in batch
        const notifications = await this.prisma.notification.createMany({
            data: userIds.map(userId => ({
                userId,
                type,
                data,
            })),
        });

        // Broadcast to each user in real-time
        for (const userId of userIds) {
            this.gateway.sendToUser(userId, 'NEW_NOTIFICATION', {
                type,
                data,
                createdAt: new Date(),
            });
        }

        return notifications.count;
    }

}
