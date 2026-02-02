import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { NotificationsService } from '../notifications/notifications.service';

import { ActivityService } from '../activity/activity.service';
import { ActivityGateway } from '../activity/activity.gateway';

@Injectable()
export class MessagesService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
        private activityService: ActivityService,
        private gateway: ActivityGateway
    ) { }


    async getConversations(userId: string) {
        const conversations = await this.prisma.conversation.findMany({
            where: {
                OR: [{ buyerId: userId }, { sellerId: userId }],
            },
            include: {
                buyer: { select: { id: true, email: true, profile: { select: { displayName: true, avatarUrl: true } } } },
                seller: { select: { id: true, email: true, profile: { select: { displayName: true, avatarUrl: true } } } },
                listing: { select: { id: true, title: true, images: { take: 1, orderBy: { sortOrder: 'asc' } } } },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        // Transform for frontend
        return conversations.map((conv) => {
            const isBuyer = conv.buyerId === userId;
            const participant = isBuyer ? conv.seller : conv.buyer;
            const lastMessage = conv.messages[0];

            // Count unread messages
            // Note: This is a simplified count. Ideally we'd query this.
            // For now, we'll just check if the last message is unread and not from us.
            const unreadCount = lastMessage && !lastMessage.isRead && lastMessage.senderId !== userId ? 1 : 0;

            return {
                id: conv.id,
                participantId: participant.id,
                participantName: participant.profile?.displayName || participant.email,
                participantAvatar: participant.profile?.avatarUrl,
                lastMessage: lastMessage ? {
                    id: lastMessage.id,
                    content: lastMessage.body,
                    timestamp: lastMessage.createdAt.getTime(),
                    senderId: lastMessage.senderId,
                    read: lastMessage.isRead,
                } : undefined,
                unreadCount,
                listingContext: conv.listing ? {
                    id: conv.listing.id,
                    title: conv.listing.title,
                    image: conv.listing.images[0]?.url,
                } : undefined,
            };
        });
    }

    async getMessages(conversationId: string, userId: string) {
        // Verify participation
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversation || (conversation.buyerId !== userId && conversation.sellerId !== userId)) {
            throw new NotFoundException('Conversation not found');
        }

        const messages = await this.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
        });

        return messages.map(msg => ({
            id: msg.id,
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            receiverId: msg.senderId === conversation.buyerId ? conversation.sellerId : conversation.buyerId, // Derived
            content: msg.body,
            timestamp: msg.createdAt.getTime(),
            read: msg.isRead,
            type: msg.messageType,
            mediaUrl: msg.mediaUrl,
            mediaType: msg.mediaType,
        }));
    }

    async sendMessage(userId: string, data: { receiverId: string; content: string; listingId?: string }, file?: Express.Multer.File) {
        // 0. Fraud Detection: Rate Limiting
        // Check if user sent >20 messages in last 1 minute
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const recentMessagesCount = await this.prisma.message.count({
            where: {
                senderId: userId,
                createdAt: { gt: oneMinuteAgo },
            },
        });

        if (recentMessagesCount >= 20) {
            throw new ForbiddenException('You are sending messages too quickly. Please wait a moment.');
        }

        // 1. Find or create conversation
        let conversation = await this.prisma.conversation.findFirst({
            where: {
                OR: [
                    { buyerId: userId, sellerId: data.receiverId, listingId: data.listingId },
                    { buyerId: data.receiverId, sellerId: userId, listingId: data.listingId },
                ],
            },
        });

        if (!conversation) {
            // Assume sender is buyer if creating new conv with listing, unless specified otherwise (logic can be complex)
            // For simplicity, if listingId is present, current user is buyer.
            conversation = await this.prisma.conversation.create({
                data: {
                    buyerId: userId,
                    sellerId: data.receiverId,
                    listingId: data.listingId,
                },
            });

            // Track new conversation for seller's response rate
            await this.trackNewConversationForSeller(data.receiverId);

            // Trigger Activity Feed
            this.activityService.handleChatStarted(conversation.id, userId).catch(err => {
                console.error('Failed to trigger activity feed for new chat:', err);
            });
        }

        // Track seller's first response
        if (userId === conversation.sellerId && !conversation.sellerFirstResponseAt) {
            await this.trackSellerResponse(conversation);
        }

        // 2. Prepare media data
        let mediaUrl: string | undefined;
        let mediaType: string | undefined;

        if (file) {
            mediaUrl = `/uploads/${file.filename}`;
            if (file.mimetype.startsWith('image/')) {
                mediaType = 'image';
            } else if (file.mimetype.startsWith('video/')) {
                mediaType = 'video';
            } else {
                mediaType = 'file'; // Fallback
            }
        }

        // 3. Create message
        const message = await this.prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId: userId,
                body: data.content || '', // Allow empty body if file is present
                mediaUrl,
                mediaType,
                messageType: data.content ? 'text' : (mediaType || 'text'), // If no content but file, assume media type? Or mix? 
                // Let's keep messageType as 'text' or 'system' mostly, but we can overload it or relies on mediaType field.
                // Schema says messageType default 'text'.
            },
        });

        // 4. Update conversation timestamp
        await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
        });

        // 5. Send Notification
        if (data.receiverId !== userId) {
            const notificationMsg = file
                ? (mediaType === 'image' ? '📷 Sent an image' : '🎥 Sent a video')
                : (data.content?.length > 50 ? data.content.substring(0, 50) + '...' : (data.content || ''));

            await this.notificationsService.create(data.receiverId, 'NEW_MESSAGE', {
                title: 'New Message',
                message: notificationMsg,
                conversationId: conversation.id,
                senderId: userId,
            });

            // 6. Real-time broadcast
            this.gateway.sendToUser(data.receiverId, 'NEW_MESSAGE', {
                ...message,
                sender: userId === conversation.buyerId ? 'buyer' : 'seller' // Helper for UI
            });
        }

        return message;
    }


    async markAsRead(conversationId: string, userId: string) {
        await this.prisma.message.updateMany({
            where: {
                conversationId,
                senderId: { not: userId }, // Mark messages sent by others as read
                isRead: false,
            },
            data: { isRead: true },
        });
    }

    async getConversationByParticipant(userId: string, participantId: string) {
        const conversation = await this.prisma.conversation.findFirst({
            where: {
                OR: [
                    { buyerId: userId, sellerId: participantId },
                    { buyerId: participantId, sellerId: userId },
                ],
            },
            include: {
                buyer: { select: { id: true, email: true, profile: { select: { displayName: true, avatarUrl: true } } } },
                seller: { select: { id: true, email: true, profile: { select: { displayName: true, avatarUrl: true } } } },
                listing: { select: { id: true, title: true, images: { take: 1, orderBy: { sortOrder: 'asc' } } } },
                barterOffer: { select: { id: true, status: true } },
            },
        });

        if (!conversation) {
            return null;
        }

        const isBuyer = conversation.buyerId === userId;
        const participant = isBuyer ? conversation.seller : conversation.buyer;

        return {
            id: conversation.id,
            participantId: participant.id,
            participantName: participant.profile?.displayName || participant.email,
            participantAvatar: participant.profile?.avatarUrl,
            listingContext: conversation.listing ? {
                id: conversation.listing.id,
                title: conversation.listing.title,
                image: conversation.listing.images[0]?.url,
            } : undefined,
            barterOffer: conversation.barterOffer ? {
                id: conversation.barterOffer.id,
                status: conversation.barterOffer.status,
            } : undefined,
        };
    }

    async startConversation(userId: string, participantId: string, listingId?: string, initialMessage?: string) {
        // Check if conversation already exists
        let conversation = await this.prisma.conversation.findFirst({
            where: {
                OR: [
                    { buyerId: userId, sellerId: participantId, listingId },
                    { buyerId: participantId, sellerId: userId, listingId },
                ],
            },
        });

        if (!conversation) {
            conversation = await this.prisma.conversation.create({
                data: {
                    buyerId: userId,
                    sellerId: participantId,
                    listingId,
                },
            });

            // Trigger Activity Feed
            this.activityService.handleChatStarted(conversation.id, userId).catch(err => {
                console.error('Failed to trigger activity feed for new chat:', err);
            });
        }

        // Send initial message if provided
        if (initialMessage) {
            await this.prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    senderId: userId,
                    body: initialMessage,
                },
            });

            // Update conversation timestamp
            await this.prisma.conversation.update({
                where: { id: conversation.id },
                data: { updatedAt: new Date() },
            });

            // Send notification
            await this.notificationsService.create(participantId, 'NEW_MESSAGE', {
                title: 'New Message',
                message: initialMessage.length > 50 ? initialMessage.substring(0, 50) + '...' : initialMessage,
                conversationId: conversation.id,
                senderId: userId,
            });
        }

        return conversation;
    }

    // Response Rate Tracking Methods

    private async trackNewConversationForSeller(sellerId: string) {
        try {
            // Increment total conversations received for the seller
            await this.prisma.userProfile.upsert({
                where: { userId: sellerId },
                update: {
                    totalConversationsReceived: { increment: 1 },
                },
                create: {
                    userId: sellerId,
                    totalConversationsReceived: 1,
                },
            });
        } catch (error) {
            console.error('Failed to track new conversation for seller:', error);
        }
    }

    private async trackSellerResponse(conversation: { id: string; createdAt: Date; sellerId: string }) {
        try {
            const now = new Date();
            const conversationAge = now.getTime() - conversation.createdAt.getTime();
            const twentyFourHours = 24 * 60 * 60 * 1000;
            const respondedWithin24h = conversationAge <= twentyFourHours;

            // Mark the conversation as having been responded to
            await this.prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    sellerFirstResponseAt: now,
                    responseTracked: true,
                },
            });

            // Update seller's response stats if responded within 24h
            if (respondedWithin24h) {
                const profile = await this.prisma.userProfile.findUnique({
                    where: { userId: conversation.sellerId },
                });

                if (profile) {
                    const newRespondedCount = profile.conversationsRespondedWithin24h + 1;
                    const totalConversations = profile.totalConversationsReceived || 1;
                    const newResponseRate = Math.round((newRespondedCount / totalConversations) * 100);

                    await this.prisma.userProfile.update({
                        where: { userId: conversation.sellerId },
                        data: {
                            conversationsRespondedWithin24h: newRespondedCount,
                            responseRate: Math.min(100, newResponseRate),
                            lastResponseRateUpdate: now,
                        },
                    });
                }
            }
        } catch (error) {
            console.error('Failed to track seller response:', error);
        }
    }
}
