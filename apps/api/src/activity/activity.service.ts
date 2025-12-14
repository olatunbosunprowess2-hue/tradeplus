import { Injectable, Logger } from '@nestjs/common';
import { ActivityGateway } from './activity.gateway';
import { PrismaService } from '../prisma/prisma.service';

export interface ActivityEvent {
    type: 'AD_CREATED' | 'CHAT_STARTED' | 'USER_LOGIN' | 'REPORT_FILED' | 'USER_BANNED' | 'AD_DELETED';
    description: string;
    timestamp: Date;
    metadata?: any;
    userId?: string;
    userName?: string;
    targetId?: string;
    targetName?: string;
}

@Injectable()
export class ActivityService {
    private logger = new Logger(ActivityService.name);

    // In-memory counters (Refresh every restart, ideal for "Today" stats)
    // For production, use Redis
    private stats = {
        adsToday: 0,
        activeChats: 0,
        urgentReports: 0,
        loginsToday: 0
    };

    private recentFeed: ActivityEvent[] = [];
    private readonly MAX_FEED_LENGTH = 200;

    constructor(
        private gateway: ActivityGateway,
        private prisma: PrismaService
    ) { }

    // --- Public Event Handlers ---

    async handleAdCreated(adId: string, userId: string, title?: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { profile: { select: { displayName: true } }, email: true }
        });

        this.stats.adsToday++;
        await this.broadcastEvent({
            type: 'AD_CREATED',
            description: `New listing: "${title || 'Untitled'}"`,
            timestamp: new Date(),
            metadata: { adId, userId },
            userId,
            userName: user?.profile?.displayName || user?.email || 'Unknown',
            targetId: adId,
            targetName: title
        });
    }

    async handleChatStarted(chatId: string, initiatorId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: initiatorId },
            select: { profile: { select: { displayName: true } }, email: true }
        });

        this.stats.activeChats++;
        await this.broadcastEvent({
            type: 'CHAT_STARTED',
            description: 'Started a new conversation',
            timestamp: new Date(),
            metadata: { chatId, initiatorId },
            userId: initiatorId,
            userName: user?.profile?.displayName || user?.email || 'Unknown',
            targetId: chatId
        });
    }

    async handleUserLogin(userId: string, ip: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { profile: { select: { displayName: true } }, email: true }
        });

        this.stats.loginsToday++;
        await this.broadcastEvent({
            type: 'USER_LOGIN',
            description: `Logged in from ${ip}`,
            timestamp: new Date(),
            metadata: { userId, ip },
            userId,
            userName: user?.profile?.displayName || user?.email || 'Unknown'
        });
    }

    async handleReportFiled(reportId: string, reporterId: string, reason?: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: reporterId },
            select: { profile: { select: { displayName: true } }, email: true }
        });

        this.stats.urgentReports++;
        await this.broadcastEvent({
            type: 'REPORT_FILED',
            description: `Filed report: ${reason || 'No reason provided'}`,
            timestamp: new Date(),
            metadata: { reportId },
            userId: reporterId,
            userName: user?.profile?.displayName || user?.email || 'Unknown',
            targetId: reportId
        });
    }

    async handleUserBanned(userId: string, adminId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { profile: { select: { displayName: true } }, email: true }
        });

        await this.broadcastEvent({
            type: 'USER_BANNED',
            description: 'User was banned',
            timestamp: new Date(),
            metadata: { userId, adminId },
            userId,
            userName: user?.profile?.displayName || user?.email || 'Unknown'
        });
    }

    async handleAdDeleted(adId: string, title: string, adminId: string) {
        await this.broadcastEvent({
            type: 'AD_DELETED',
            description: `Listing deleted: "${title}"`,
            timestamp: new Date(),
            metadata: { adId, adminId },
            targetId: adId,
            targetName: title
        });
    }

    // --- Internal Logic ---

    private async broadcastEvent(event: ActivityEvent) {
        // Update Feed
        this.recentFeed.unshift(event);
        if (this.recentFeed.length > this.MAX_FEED_LENGTH) {
            this.recentFeed.pop();
        }

        // Broadcast to Dashboard
        this.gateway.broadcast('NEW_ACTIVITY', event);
        this.gateway.broadcast('STATS_UPDATE', this.stats);
    }

    getDashboardStats() {
        return {
            stats: this.stats,
            feed: this.recentFeed.slice(0, 20)
        };
    }

    // --- Enhanced Dashboard Methods ---

    /**
     * Get comprehensive activity statistics
     */
    async getActivityStats() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const last1Hour = new Date(now.getTime() - 60 * 60 * 1000);

        const [
            adsToday,
            ads7Days,
            ads30Days,
            reportsToday,
            chatsLastHour,
            activeChatsNow,
        ] = await Promise.all([
            this.prisma.listing.count({ where: { createdAt: { gte: todayStart } } }),
            this.prisma.listing.count({ where: { createdAt: { gte: last7Days } } }),
            this.prisma.listing.count({ where: { createdAt: { gte: last30Days } } }),
            this.prisma.report.count({ where: { createdAt: { gte: todayStart } } }),
            this.prisma.conversation.count({ where: { createdAt: { gte: last1Hour } } }),
            this.prisma.conversation.count({
                where: {
                    updatedAt: { gte: last1Hour }
                }
            }),
        ]);

        return {
            ads: {
                today: adsToday,
                last7Days: ads7Days,
                last30Days: ads30Days
            },
            chats: {
                activeNow: activeChatsNow,
                startedLastHour: chatsLastHour
            },
            reports: {
                today: reportsToday
            }
        };
    }

    /**
     * Get top 10 most active users in last 24 hours (by ads + chats)
     */
    async getTopActiveUsers(hours: number = 24) {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);

        // Get users with most listings in last 24h
        const topSellers = await this.prisma.listing.groupBy({
            by: ['sellerId'],
            where: { createdAt: { gte: since } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 20
        });

        // Get users with most conversations in last 24h
        const topChatters = await this.prisma.message.groupBy({
            by: ['senderId'],
            where: { createdAt: { gte: since } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 20
        });

        // Combine and deduplicate
        const userScores: Record<string, { ads: number; chats: number }> = {};

        for (const seller of topSellers) {
            userScores[seller.sellerId] = { ads: seller._count.id, chats: 0 };
        }

        for (const chatter of topChatters) {
            if (userScores[chatter.senderId]) {
                userScores[chatter.senderId].chats = chatter._count.id;
            } else {
                userScores[chatter.senderId] = { ads: 0, chats: chatter._count.id };
            }
        }

        // Sort by total activity
        const sortedUserIds = Object.entries(userScores)
            .map(([id, scores]) => ({ id, total: scores.ads + scores.chats, ...scores }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        // Fetch user details
        const users = await this.prisma.user.findMany({
            where: { id: { in: sortedUserIds.map(u => u.id) } },
            select: {
                id: true,
                email: true,
                status: true,
                profile: { select: { displayName: true, avatarUrl: true } }
            }
        });

        return sortedUserIds.map(u => {
            const user = users.find(usr => usr.id === u.id);
            return {
                userId: u.id,
                displayName: user?.profile?.displayName || user?.email || 'Unknown',
                avatarUrl: user?.profile?.avatarUrl,
                status: user?.status,
                adsPosted: u.ads,
                chatsSent: u.chats,
                totalActivity: u.total
            };
        });
    }

    /**
     * Get recent login IPs with suspicious warnings
     */
    async getRecentLoginIps(limit: number = 50) {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Get recent device fingerprints with IPs
        const fingerprints = await this.prisma.deviceFingerprint.findMany({
            where: { createdAt: { gte: last24Hours } },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { displayName: true } }
                    }
                }
            }
        });

        // Count accounts per IP in last 24h
        const ipCounts = await this.prisma.user.groupBy({
            by: ['signupIpAddress'],
            where: {
                createdAt: { gte: last24Hours },
                signupIpAddress: { not: null }
            },
            _count: { id: true }
        });

        const suspiciousIps = new Set(
            ipCounts.filter(ip => ip._count.id > 3).map(ip => ip.signupIpAddress)
        );

        return fingerprints.map(fp => ({
            ip: fp.ipAddress,
            country: fp.country || 'Unknown',
            userId: fp.userId,
            userName: fp.user.profile?.displayName || fp.user.email,
            lastSeen: fp.createdAt,
            isSuspicious: suspiciousIps.has(fp.ipAddress),
            userAgent: fp.userAgent
        }));
    }

    /**
     * Get the live activity feed (last N actions)
     */
    async getLiveActivityFeed(limit: number = 20) {
        // Combine in-memory feed with database audit logs
        const auditLogs = await this.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { displayName: true } }
                    }
                },
                targetUser: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { displayName: true } }
                    }
                }
            }
        });

        const feed = auditLogs.map(log => ({
            type: log.action,
            description: this.formatAuditAction(log.action, log.details as any),
            timestamp: log.createdAt,
            userId: log.userId,
            userName: log.user.profile?.displayName || log.user.email,
            targetId: log.targetUserId,
            targetName: log.targetUser?.profile?.displayName || log.targetUser?.email,
            metadata: log.details
        }));

        // Merge with in-memory feed, sort by timestamp descending
        return [...this.recentFeed, ...feed]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
    }

    private formatAuditAction(action: string, details: any): string {
        switch (action) {
            case 'ROLE_ASSIGNED': return `Assigned role: ${details?.roleName}`;
            case 'ROLE_REMOVED': return `Removed role from user`;
            case 'USER_BANNED': return 'Banned user';
            case 'USER_UNBANNED': return 'Unbanned user';
            case 'LISTING_DELETED': return 'Deleted listing';
            default: return action.replace(/_/g, ' ').toLowerCase();
        }
    }
}

