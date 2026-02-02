import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityGateway } from '../activity/activity.gateway';


@Injectable()
export class NotificationsService {
    constructor(
        private prisma: PrismaService,
        private gateway: ActivityGateway
    ) { }


    async findAll(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getUnreadCount(userId: string) {
        return this.prisma.notification.count({
            where: {
                userId,
                readAt: null,
            },
        });
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
