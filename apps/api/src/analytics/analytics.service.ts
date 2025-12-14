import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async getKPIs() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const [
            usersToday, usersYesterday,
            adsToday, adsYesterday,
            chatsToday, chatsYesterday,
            reportsToday, reportsYesterday
        ] = await Promise.all([
            this.prisma.user.count({ where: { createdAt: { gte: today } } }),
            this.prisma.user.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
            this.prisma.listing.count({ where: { createdAt: { gte: today } } }),
            this.prisma.listing.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
            this.prisma.conversation.count({ where: { createdAt: { gte: today } } }),
            this.prisma.conversation.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
            this.prisma.report.count({ where: { createdAt: { gte: today } } }),
            this.prisma.report.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
        ]);

        return {
            users: { current: usersToday, prev: usersYesterday, delta: this.calculateDelta(usersToday, usersYesterday) },
            ads: { current: adsToday, prev: adsYesterday, delta: this.calculateDelta(adsToday, adsYesterday) },
            chats: { current: chatsToday, prev: chatsYesterday, delta: this.calculateDelta(chatsToday, chatsYesterday) },
            reports: { current: reportsToday, prev: reportsYesterday, delta: this.calculateDelta(reportsToday, reportsYesterday) },
        };
    }

    private calculateDelta(current: number, prev: number): number {
        if (prev === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - prev) / prev) * 100);
    }

    async getTopCategories() {
        const cached = await this.prisma.listing.groupBy({
            by: ['categoryId'], // Note: Category is relation, so this groups by categoryId actually if defined as INT
            _count: { id: true },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 10
        });

        // We need category names. Fetch all categories first or map them.
        // Efficient way: Fetch categories where ID in cached.
        const categoryIds = cached.map(c => c.categoryId);
        const categories = await this.prisma.category.findMany({
            where: { id: { in: categoryIds } }
        });

        // However, Views are not on Category model, they are sum of Listing views.
        // Let's do a raw query for best performance and correctness.
        const stats = await this.prisma.$queryRaw`
            SELECT c.name as category, COUNT(l.id) as ads, COALESCE(SUM(l.views), 0) as views
            FROM listings l
            JOIN categories c ON l.category_id = c.id
            GROUP BY c.name
            ORDER BY views DESC
            LIMIT 10
        `;

        // Prisma Raw returns BigInt for count/sum often, need serialization.
        return JSON.parse(JSON.stringify(stats, (key, value) =>
            typeof value === 'bigint' ? Number(value) : value
        ));
    }

    async getHotListings() {
        try {
            // Hot Score = Views + (Conversations * 5)
            // Timeframe: Active listings created in last 30 days
            const hotListings = await this.prisma.listing.findMany({
                where: {
                    status: 'active',
                    createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                },
                include: {
                    _count: {
                        select: { conversations: true }
                    }
                },
                orderBy: { views: 'desc' },
                take: 50
            });

            const scored = hotListings.map(l => {
                // Explicitly cast views to Number if it is BigInt, or default to 0
                const views = Number(l.views || 0);
                const chats = l._count.conversations;
                return {
                    id: l.id,
                    title: l.title,
                    views: views,
                    chatCount: chats,
                    score: views + (chats * 5)
                };
            });

            return scored.sort((a, b) => b.score - a.score).slice(0, 20);
        } catch (e) {
            console.error("Hot Listings Error", e);
            return [];
        }
    }

    async getSpamStats() {
        // 1. Hourly Deleted Ads (Last 24h)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Using AuditLogs for 'DELETE_LISTING'
        const deletedLogs = await this.prisma.auditLog.groupBy({
            by: ['createdAt'],
            where: {
                action: 'DELETE_LISTING',
                createdAt: { gte: yesterday }
            },
        });

        // Aggregate in JS (since group by hour is tricky in polyglot Prisma)
        const hourlyMap = new Map<number, number>();
        deletedLogs.forEach(log => {
            const hour = new Date(log.createdAt).getHours();
            hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
        });

        const hourlyDeleted = Array.from({ length: 24 }, (_, i) => {
            const h = (new Date().getHours() - i + 24) % 24; // Reverse from now? Or simple 0-23.
            // Let's do simple 0-23 sorted
            return { time: `${i}:00`, count: hourlyMap.get(i) || 0 };
        });


        // 2. Suspicious IPs (Users created per IP in last 7 days)
        // Since User model doesn't have ipAddress, we check AuditLog 'USER_LOGIN' or similar if available.
        // Fallback: If we don't track registration IP, we can't do this perfectly yet.
        // We will query AuditLogs for 'USER_LOGIN' distinct users per IP.

        const suspiciousIPsRaw = await this.prisma.$queryRaw`
            SELECT ip_address as ip, COUNT(DISTINCT user_id) as accounts
            FROM audit_logs
            WHERE created_at > NOW() - INTERVAL '7 days' 
              AND ip_address IS NOT NULL
            GROUP BY ip_address
            HAVING COUNT(DISTINCT user_id) > 1 
            ORDER BY accounts DESC
            LIMIT 10
        `;

        const suspiciousIPs = JSON.parse(JSON.stringify(suspiciousIPsRaw, (key, value) =>
            typeof value === 'bigint' ? Number(value) : value
        )).map((ip: any) => ({ ...ip, country: 'Unknown' })); // GeoIP would go here


        // 3. Created vs Banned Trend (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const createdUsers = await this.prisma.user.groupBy({
            by: ['createdAt'],
            where: { createdAt: { gte: sevenDaysAgo } }
        });

        // Mocking banned counts as we don't have bannedAt field or Audit History easily accessible via groupBy
        // But let's try to get AuditLogs for 'BAN_USER'
        const bannedLogs = await this.prisma.auditLog.groupBy({
            by: ['createdAt'],
            where: { action: 'BAN_USER', createdAt: { gte: sevenDaysAgo } }
        });

        // Group by Date String YYYY-MM-DD
        const trendMap = new Map<string, { created: number, banned: number }>();

        const process = (list: any[], key: 'created' | 'banned') => {
            list.forEach(item => {
                const day = new Date(item.createdAt).toISOString().split('T')[0];
                if (!trendMap.has(day)) trendMap.set(day, { created: 0, banned: 0 });
                trendMap.get(day)![key]++;
            });
        };

        process(createdUsers, 'created');
        process(bannedLogs, 'banned');

        const bannedVsCreated = Array.from(trendMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, stats]) => ({ date, ...stats }));

        return {
            hourlyDeleted,
            bannedVsCreated,
            suspiciousIPs
        };
    }
}
