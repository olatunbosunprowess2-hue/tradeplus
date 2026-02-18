import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { LIMITS, PRICING, PURCHASE_TYPES } from './pricing.constants';
import { ActivationResult } from './interfaces/activation-result.interface';

export interface ChatLimitResult {
    allowed: boolean;
    remaining: number;
    isPremium: boolean;
    hasChatPass: boolean;
}

export interface ListingLimitResult {
    allowed: boolean;
    remaining: number;
    isPremium: boolean;
    currentCount: number;
}

export interface CommunityLimitResult {
    allowed: boolean;
    remaining: number;
    isPremium: boolean;
}

@Injectable()
export class MonetizationService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => NotificationsService))
        private notificationsService: NotificationsService,
        @Inject(forwardRef(() => EmailService))
        private emailService: EmailService,
    ) { }

    /**
     * Check if user can start a new chat conversation
     */
    async checkChatLimit(userId: string): Promise<ChatLimitResult> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                tier: true,
                chatPassExpiry: true,
                dailyChatCount: true,
                dailyChatResetAt: true,
            },
        });

        if (!user) {
            return { allowed: false, remaining: 0, isPremium: false, hasChatPass: false };
        }

        const isPremium = user.tier === 'premium';
        const now = new Date();

        // Check if chat pass is active
        const hasChatPass = user.chatPassExpiry && user.chatPassExpiry > now;

        // Premium users and users with chat pass have unlimited chats
        if (isPremium || hasChatPass) {
            return { allowed: true, remaining: 999, isPremium, hasChatPass: !!hasChatPass };
        }

        // Reset daily count if needed
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let currentCount = user.dailyChatCount;
        if (!user.dailyChatResetAt || user.dailyChatResetAt < today) {
            // Reset the counter for new day
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    dailyChatCount: 0,
                    dailyChatResetAt: now,
                },
            });
            currentCount = 0;
        }

        const remaining = Math.max(0, LIMITS.FREE_DAILY_CHATS - currentCount);
        return {
            allowed: currentCount < LIMITS.FREE_DAILY_CHATS,
            remaining,
            isPremium,
            hasChatPass: false,
        };
    }

    /**
     * Increment user's daily chat count
     */
    async incrementChatCount(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                dailyChatCount: { increment: 1 },
            },
        });
    }

    /**
     * Check if user can create a new listing
     */
    async checkListingLimit(userId: string): Promise<ListingLimitResult> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { tier: true },
        });

        if (!user) {
            return { allowed: false, remaining: 0, isPremium: false, currentCount: 0 };
        }

        const isPremium = user.tier === 'premium';

        // Premium users have unlimited listings
        if (isPremium) {
            return { allowed: true, remaining: 999, isPremium, currentCount: 0 };
        }

        // Count active listings
        const currentCount = await this.prisma.listing.count({
            where: {
                sellerId: userId,
                status: 'active',
            },
        });

        const remaining = Math.max(0, LIMITS.FREE_LISTINGS - currentCount);
        return {
            allowed: currentCount < LIMITS.FREE_LISTINGS,
            remaining,
            isPremium,
            currentCount,
        };
    }

    /**
     * Check if user can create a community post
     */
    async checkCommunityPostLimit(userId: string): Promise<CommunityLimitResult> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { tier: true, dailyPostCount: true, dailyPostResetAt: true },
        });

        if (!user) return { allowed: false, remaining: 0, isPremium: false };
        if (user.tier === 'premium') return { allowed: true, remaining: 999, isPremium: true };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let currentCount = user.dailyPostCount;
        if (!user.dailyPostResetAt || user.dailyPostResetAt < today) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { dailyPostCount: 0, dailyPostResetAt: new Date() },
            });
            currentCount = 0;
        }

        const limit = LIMITS.FREE_COMMUNITY_POSTS;
        const remaining = Math.max(0, limit - currentCount);
        return {
            allowed: currentCount < limit,
            remaining,
            isPremium: false,
        };
    }

    /**
     * Increment daily post count
     */
    async incrementPostCount(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { dailyPostCount: { increment: 1 } },
        });
    }

    /**
     * Check if user can make a community offer
     */
    async checkCommunityOfferLimit(userId: string): Promise<CommunityLimitResult> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { tier: true, dailyOfferCount: true, dailyOfferResetAt: true },
        });

        if (!user) return { allowed: false, remaining: 0, isPremium: false };
        if (user.tier === 'premium') return { allowed: true, remaining: 999, isPremium: true };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let currentCount = user.dailyOfferCount;
        if (!user.dailyOfferResetAt || user.dailyOfferResetAt < today) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { dailyOfferCount: 0, dailyOfferResetAt: new Date() },
            });
            currentCount = 0;
        }

        const limit = LIMITS.FREE_COMMUNITY_POSTS; // Use same limit as posts for offers
        const remaining = Math.max(0, limit - currentCount);
        return {
            allowed: currentCount < limit,
            remaining,
            isPremium: false,
        };
    }

    /**
     * Increment daily offer count
     */
    async incrementOfferCount(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { dailyOfferCount: { increment: 1 } },
        });
    }

    /**
     * Activate chat pass for user (valid until end of current month)
     */
    async activateChatPass(userId: string): Promise<{ success: boolean; message: string }> {
        // [DEPRECATED] Free chat limit increased to 15. Standalone pass no longer sold.
        return {
            success: true,
            message: '🎫 All good! You already have access to a high daily chat limit of 15.'
        };
    }

    /**
     * Activate spotlight for a listing
     */
    async activateSpotlight(listingId: string, days: number): Promise<ActivationResult> {
        const now = new Date();
        const expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        await this.prisma.listing.update({
            where: { id: listingId },
            data: {
                spotlightExpiry: expiryDate,
                isFeatured: true,
            },
        });

        return {
            success: true,
            message: `✨ Your listing is now spotlighted! It will stay at the top of search results for ${days} days.`
        };
    }

    /**
     * Use a free spotlight credit (for Premium users)
     */
    async useSpotlightCredit(userId: string, listingId: string): Promise<ActivationResult> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { spotlightCredits: true, tier: true },
        });

        if (!user || user.tier !== 'premium') {
            return { success: false, message: 'Only Premium members can use spotlight credits.' };
        }

        if (user.spotlightCredits <= 0) {
            return { success: false, message: 'You have no spotlight credits remaining.' };
        }

        // Deduct credit and activate spotlight (standard 7 days for a credit)
        await this.prisma.user.update({
            where: { id: userId },
            data: { spotlightCredits: { decrement: 1 } },
        });

        return await this.activateSpotlight(listingId, 7);
    }

    /**
     * Cross-list a distress sale item to the normal feed
     */
    async activateCrossList(listingId: string): Promise<{ success: boolean; message: string }> {
        await this.prisma.listing.update({
            where: { id: listingId },
            data: {
                isCrossListed: true,
            },
        });

        return {
            success: true,
            message: '🔗 Your distress sale has been cross-listed to the main marketplace for maximum visibility!'
        };
    }

    /**
     * Activate aggressive boost (cross-list + push notification to nearby category subscribers)
     * Implements "Cold Start Waterfall" logic:
     * 1. Broad Fetch: 50 users in region, under spam limit, ordered by lastActiveAt (safety net)
     * 2. In-Memory Scoring: Region base + Wants bonus + Cart bonus
     * 3. Select Top 10 by score
     * 4. Return standardized ActivationResult
     */
    async activateAggressiveBoost(listingId: string): Promise<ActivationResult> {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Fetch listing with category, seller, and region info
        const listing = await this.prisma.listing.update({
            where: { id: listingId },
            data: {
                isCrossListed: true,
                pushNotificationSent: true,
            },
            include: {
                category: true,
                seller: { select: { firstName: true, lastName: true } },
                region: { select: { name: true } },
            },
        });

        if (!listing) {
            return { success: false, message: 'Listing not found.' };
        }

        console.log(`🚀 [AGGRESSIVE BOOST] Listing: "${listing.title}" (${listingId})`);
        console.log(`   Category: ${listing.category.name} | Region: ${listing.region?.name || 'none'}`);

        // ========================================
        // STEP 1: BROAD FETCH (Cold Start Safe)
        // ========================================
        // Hard Filters: Region + Anti-Spam
        // Safety Net: Order by lastActiveAt (ensures we get active users even if no one has carts/wants)
        const eligibleUsers = await this.prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: listing.sellerId } },
                    { status: 'active' },
                    // Hard Filter: Same region (indexed)
                    ...(listing.regionId ? [{ profile: { regionId: listing.regionId } }] : []),
                    // Anti-Spam: Under 2 notifications in 24h
                    {
                        OR: [
                            { boostNotificationResetAt: null },
                            { boostNotificationResetAt: { lt: twentyFourHoursAgo } },
                            { boostNotificationCount24h: { lt: 2 } },
                        ]
                    },
                ]
            },
            select: {
                id: true,
                updatedAt: true,
                boostNotificationCount24h: true,
                boostNotificationResetAt: true,
                // Include relations for in-memory scoring
                carts: {
                    where: { items: { some: { listing: { categoryId: listing.categoryId } } } },
                    take: 1
                },
                wants: {
                    where: { category: { contains: listing.category.name, mode: 'insensitive' } },
                    take: 1
                }
            },
            // Safety Net: Most recently active users first (ensures pool even with no carts/wants)
            orderBy: { updatedAt: 'desc' },
            take: 50, // Broad pool for scoring
        });

        console.log(`   📊 Pool fetched: ${eligibleUsers.length} active users in region`);

        // ========================================
        // STEP 2: IN-MEMORY SCORING
        // ========================================
        const scoredUsers = eligibleUsers.map(user => {
            let score = 10; // Base score: They are in the correct region (hard filtered)

            // Bonus: Has a "Want" post matching this category (Strongest intent)
            if (user.wants && user.wants.length > 0) {
                score += 7;
            }

            // Bonus: Has matching items in cart (High interest)
            if (user.carts && user.carts.length > 0) {
                score += 5;
            }

            return { ...user, score };
        });

        // ========================================
        // STEP 3: SELECT TOP 10 (Survivor Logic)
        // ========================================
        const topUsers = scoredUsers
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        const userIds = topUsers.map(u => u.id);

        // Logging for transparency
        const highIntentCount = topUsers.filter(u => u.score > 10).length;
        const topScore = topUsers[0]?.score || 0;

        console.log(`   🎯 Scoring Summary:`);
        console.log(`      🏆 High-Intent Users (score > 10): ${highIntentCount}`);
        console.log(`      💡 Active Fallback Users: ${topUsers.length - highIntentCount}`);
        console.log(`      🔥 Top Score: ${topScore}`);
        console.log(`   Final: Notifying ${userIds.length} buyers`);

        // ========================================
        // STEP 4: EXECUTE NOTIFICATIONS
        // ========================================
        if (userIds.length > 0) {
            const sellerName = [listing.seller.firstName, listing.seller.lastName].filter(Boolean).join(' ') || 'A seller';

            // Send in-app notifications only (no email)
            const notificationCount = await this.notificationsService.createBulkNotifications(
                userIds,
                'aggressive_boost',
                {
                    listingId: listing.id,
                    listingTitle: listing.title,
                    categoryName: listing.category.name,
                    sellerName,
                    message: `🔥 Hot deal: "${listing.title}" in ${listing.category.name}!`,
                }
            );

            console.log(`   ✅ Sent ${notificationCount} in-app notifications`);

            // Update user spam counters (async, don't block)
            for (const user of topUsers) {
                const needsReset = !user.boostNotificationResetAt || user.boostNotificationResetAt < twentyFourHoursAgo;

                this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        lastBoostNotificationAt: now,
                        boostNotificationCount24h: needsReset ? 1 : { increment: 1 },
                        boostNotificationResetAt: needsReset ? now : undefined,
                    }
                }).catch(err => {
                    console.error(`   ⚠️ Failed to update spam counter for user ${user.id}:`, err.message);
                });
            }

            const regionName = listing.region?.name || 'your area';
            return {
                success: true,
                message: `🚀 Your listing is now boosted! We notified ${userIds.length} active buyers in ${regionName}.`
            };
        } else {
            console.log(`   ⚠️ No eligible users found - boost flags set but no notifications sent`);
            return {
                success: true,
                message: `✨ Your listing is now boosted and cross-listed! Potential buyers in your area will be notified as they browse.`
            };
        }
    }

    /**
     * Upgrade user to premium tier
     */
    async upgradeToPremium(userId: string): Promise<{ success: boolean; message: string }> {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await this.prisma.$transaction([
            // Update user tier
            this.prisma.user.update({
                where: { id: userId },
                data: {
                    tier: 'premium',
                    spotlightCredits: { increment: LIMITS.PREMIUM_SPOTLIGHT_CREDITS },
                },
            }),
            // Create subscription record
            this.prisma.subscription.create({
                data: {
                    userId,
                    status: 'active',
                    expiresAt,
                },
            }),
        ]);

        return {
            success: true,
            message: '👑 Welcome to Empire Status! Your premium benefits, including unlimited listings and chats, are now active.'
        };
    }

    /**
     * Check if user is premium
     */
    async isPremium(userId: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { tier: true },
        });
        return user?.tier === 'premium';
    }

    /**
     * Get user's current tier and monetization status
     */
    async getUserMonetizationStatus(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                tier: true,
                chatPassExpiry: true,
                dailyChatCount: true,
                spotlightCredits: true,
            },
        });

        if (!user) return null;

        const now = new Date();
        const activeListings = await this.prisma.listing.count({
            where: { sellerId: userId, status: 'active' },
        });

        return {
            tier: user.tier,
            isPremium: user.tier === 'premium',
            hasChatPass: user.chatPassExpiry && user.chatPassExpiry > now,
            chatPassExpiry: user.chatPassExpiry,
            dailyChatsUsed: user.dailyChatCount,
            dailyChatsRemaining: Math.max(0, LIMITS.FREE_DAILY_CHATS - user.dailyChatCount),
            spotlightCredits: user.spotlightCredits,
            activeListings,
            listingsRemaining: user.tier === 'premium' ? 999 : Math.max(0, LIMITS.FREE_LISTINGS - activeListings),
        };
    }
}
