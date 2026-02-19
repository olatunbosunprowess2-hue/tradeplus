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
            take: 50,
        });
    }

    async getUnreadCount(userId: string) {
        // Use groupBy to count directly in the database instead of loading all rows
        const groups = await this.prisma.notification.groupBy({
            by: ['type'],
            where: {
                userId,
                readAt: null,
            },
            _count: true,
        });

        let offersCount = 0;
        let systemCount = 0;

        const offerTypes = ['NEW_OFFER', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'OFFER_COUNTERED', 'offer'];

        for (const g of groups) {
            if (offerTypes.includes(g.type)) {
                offersCount += g._count;
            } else if (g.type !== 'message' && g.type !== 'NEW_MESSAGE') {
                systemCount += g._count;
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
