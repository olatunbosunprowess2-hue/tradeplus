import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AdminListingQueryDto } from './dto/admin-listing-query.dto';
import { UpdateListingStatusDto } from './dto/update-listing-status.dto';
import { AdminReportQueryDto } from './dto/admin-report-query.dto';

import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';


@Injectable()
export class AdminService {
    private sidebarStatsCache: { data: any; lastUpdated: number } | null = null;
    private statsCache: { data: any; lastUpdated: number } | null = null;
    private readonly CACHE_TTL = 60 * 1000; // 60 seconds

    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
        private emailService: EmailService,
        private auditService: AuditService,
    ) { }


    async getUser(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                profile: true,
                _count: {
                    select: {
                        listings: true,
                        ordersBought: true,
                        ordersSold: true,
                        reportsMade: true,
                        reportsAgainst: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async getUserReports(userId: string) {
        // Get all reports where this user was the reported party
        const reports = await this.prisma.report.findMany({
            where: {
                OR: [
                    { reportedUserId: userId },
                    { listing: { sellerId: userId } } // Also include reports on their listings
                ]
            },
            include: {
                reporter: {
                    include: { profile: true }
                },
                listing: {
                    select: { id: true, title: true }
                },
                resolvedByAdmin: {
                    include: { profile: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return {
            total: reports.length,
            reports
        };
    }

    async getUsers(query: AdminUserQueryDto) {
        const { search, role, status, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { phoneNumber: { contains: search, mode: 'insensitive' } },
                { locationAddress: { contains: search, mode: 'insensitive' } },
                { profile: { displayName: { contains: search, mode: 'insensitive' } } },
            ];
        }

        if (role) {
            where.role = role;
        }

        if (status) {
            where.status = status;
        }

        if (query.verificationStatus) {
            where.verificationStatus = query.verificationStatus;
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                include: {
                    profile: true,
                    _count: {
                        select: {
                            listings: true,
                            ordersBought: true,
                            ordersSold: true,
                            reportsMade: true,
                            reportsAgainst: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: users.map((user) => {
                const {
                    passwordHash,
                    ...safeUser
                } = user;
                return safeUser;
            }),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async updateUserStatus(id: string, dto: UpdateUserStatusDto, adminId: string, adminMessage?: string) {

        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { profile: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const previousStatus = user.status;
        const data: any = {};
        if (dto.status) data.status = dto.status;
        if (dto.verificationStatus) data.verificationStatus = dto.verificationStatus;
        if (dto.rejectionReason) data.rejectionReason = dto.rejectionReason;

        // If approving verification, verify the profile too
        if (dto.verificationStatus === 'VERIFIED') {
            data.isVerified = true;
            data.isEmailVerified = true; // Sync email verification with identity verification

            // Parse location from address if available
            let locationUpdate: any = { isVerified: true };

            if (user.locationAddress) {
                // Try to find matching region/state in address
                // Address format usually: "123 Street, City, State, Country"
                const addressLower = user.locationAddress.toLowerCase();

                // Find Nigeria first
                const nigeria = await this.prisma.country.findFirst({
                    where: { name: 'Nigeria' }
                });

                if (nigeria) {
                    locationUpdate.countryId = nigeria.id;

                    // Find matching region
                    const regions = await this.prisma.region.findMany({
                        where: { countryId: nigeria.id }
                    });

                    const matchedRegion = regions.find(r => addressLower.includes(r.name.toLowerCase()));
                    if (matchedRegion) {
                        locationUpdate.regionId = matchedRegion.id;
                    }
                }
            }

            // Also update profile isVerified and location
            await this.prisma.userProfile.update({
                where: { userId: id },
                data: locationUpdate,
            });

            // Notify user
            await this.notificationsService.create(
                id,
                'VERIFICATION_APPROVED',
                {
                    message: 'Your identity verification has been approved! You can now list items and trade.',
                    timestamp: new Date(),
                    link: '/profile',
                }
            );

            // Send email
            await this.emailService.sendVerificationApproved(
                user.email,
                user.profile?.displayName || user.firstName || 'User'
            );
        } else if (dto.verificationStatus === 'REJECTED') {
            data.isVerified = false;
            await this.prisma.userProfile.update({
                where: { userId: id },
                data: { isVerified: false },
            });

            // Notify user
            await this.notificationsService.create(
                id,
                'VERIFICATION_REJECTED',
                {
                    message: `Your verification was rejected. Reason: ${dto.rejectionReason || 'Documents did not meet requirements.'}`,
                    timestamp: new Date(),
                    link: '/profile',
                }
            );

            // Send email
            await this.emailService.sendVerificationRejected(
                user.email,
                user.profile?.displayName || user.firstName || 'User',
                dto.rejectionReason || 'Documents did not meet requirements.'
            );
        } else if (dto.verificationStatus === 'PENDING') {
            data.isVerified = false;
            await this.prisma.userProfile.update({
                where: { userId: id },
                data: { isVerified: false },
            });
        }

        // Handle user status changes (suspend/ban/restore)
        if (dto.status && dto.status !== previousStatus) {
            if (dto.status === 'suspended') {
                const defaultMessage = 'Your account has been temporarily suspended due to violation of our community guidelines. You can submit an appeal if you believe this was done in error.';
                await this.notificationsService.create(
                    id,
                    'USER_SUSPENDED',
                    {
                        message: adminMessage || defaultMessage,
                        timestamp: new Date(),
                        link: '/profile',
                    }
                );

                // Send email
                await this.emailService.sendAccountSuspended(
                    user.email,
                    user.profile?.displayName || user.firstName || 'User',
                    adminMessage || defaultMessage
                );
            } else if (dto.status === 'banned') {
                const defaultMessage = 'Your account has been permanently banned due to severe or repeated violations of our community guidelines.';
                await this.notificationsService.create(
                    id,
                    'USER_BANNED',
                    {
                        message: adminMessage || defaultMessage,
                        timestamp: new Date(),
                        link: '/profile',
                    }
                );
            } else if (dto.status === 'active' && (previousStatus === 'suspended' || previousStatus === 'banned')) {
                // Always use a positive welcome back message for reactivation
                const reactivationMessage = 'Great news! Your account has been reactivated. Welcome back to the community! Please ensure you follow our guidelines.';
                await this.notificationsService.create(
                    id,
                    'SUSPENSION_REMOVED',
                    {
                        message: reactivationMessage,
                        timestamp: new Date(),
                        link: '/profile',
                    }
                );
            }
        }

        const updated = await this.prisma.user.update({
            where: { id },
            data,
            include: {
                profile: true,
                _count: {
                    select: {
                        listings: true,
                        ordersBought: true,
                        ordersSold: true,
                    },
                },
            },
        });

        if (dto.status || dto.verificationStatus) {
            await this.auditService.log(
                adminId,
                'UPDATE_USER_STATUS',
                id, // targetUserId
                {
                    status: dto.status,
                    verificationStatus: dto.verificationStatus,
                    reason: dto.rejectionReason || adminMessage
                }
            );
        }


        const { passwordHash, ...userWithoutPassword } = updated;

        return userWithoutPassword;
    }

    async getListings(query: AdminListingQueryDto) {
        const { search, status, categoryId, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status) {
            where.status = status;
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (query.isDistressSale !== undefined) {
            where.isDistressSale = query.isDistressSale === 'true';
        }


        const [listings, total] = await Promise.all([
            this.prisma.listing.findMany({
                where,
                skip,
                take: limit,
                include: {
                    seller: {
                        include: { profile: true },
                    },
                    category: true,
                    images: {
                        orderBy: { sortOrder: 'asc' },
                        take: 1,
                    },
                    _count: {
                        select: {
                            barterOffers: true,
                            reports: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.listing.count({ where }),
        ]);

        return {
            data: listings.map((listing) => ({
                ...listing,
                priceCents: listing.priceCents ? Number(listing.priceCents) : null,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async updateListingStatus(id: string, dto: UpdateListingStatusDto, adminId: string) {

        const listing = await this.prisma.listing.findUnique({
            where: { id },
        });

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        const updated = await this.prisma.listing.update({
            where: { id },
            data: { status: dto.status },
            include: {
                seller: {
                    include: { profile: true },
                },
                category: true,
                images: {
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });

        // Audit Log
        await this.auditService.log(
            adminId,
            'UPDATE_LISTING_STATUS',
            undefined, // targetUserId must be a User ID, not a listing ID
            {
                listingId: id,
                status: dto.status,
                sellerId: listing.sellerId
            }
        );



        return {

            ...updated,
            priceCents: updated.priceCents ? Number(updated.priceCents) : null,
        };
    }

    async getReports(query: AdminReportQueryDto) {
        const { status, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) {
            where.status = status;
        }

        const [reports, total] = await Promise.all([
            this.prisma.report.findMany({
                where,
                skip,
                take: limit,
                include: {
                    reporter: {
                        include: { profile: true },
                    },
                    reportedUser: {
                        include: { profile: true },
                    },
                    listing: {
                        include: {
                            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                        },
                    },
                    resolvedByAdmin: {
                        include: { profile: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.report.count({ where }),
        ]);

        return {
            data: reports,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }


    async getStats() {
        // Check cache
        if (this.statsCache && Date.now() - this.statsCache.lastUpdated < this.CACHE_TTL) {
            return this.statsCache.data;
        }

        const [
            totalUsers,
            activeUsers,
            suspendedUsers,
            totalListings,
            activeListings,
            totalOrders,
            pendingOrders,
            totalReports,
            openReports,
            pendingVerifications,
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { status: 'active' } }),
            this.prisma.user.count({ where: { status: 'suspended' } }),
            this.prisma.listing.count(),
            this.prisma.listing.count({ where: { status: 'active' } }),
            this.prisma.order.count(),
            this.prisma.order.count({ where: { status: 'pending' } }),
            this.prisma.report.count(),
            this.prisma.report.count({ where: { status: 'open' } }),
            this.prisma.user.count({ where: { verificationStatus: 'PENDING' } }),
        ]);

        const data = {
            users: {
                total: totalUsers,
                active: activeUsers,
                suspended: suspendedUsers,
                pendingVerification: pendingVerifications,
            },
            listings: {
                total: totalListings,
                active: activeListings,
            },
            orders: {
                total: totalOrders,
                pending: pendingOrders,
            },
            reports: {
                total: totalReports,
                open: openReports,
            },
        };

        // Update cache
        this.statsCache = {
            data,
            lastUpdated: Date.now(),
        };

        return data;
    }

    async getSidebarCounts() {
        // Check cache
        if (this.sidebarStatsCache && Date.now() - this.sidebarStatsCache.lastUpdated < this.CACHE_TTL) {
            return this.sidebarStatsCache.data;
        }

        const [
            pendingVerifications,
            suspendedUsers,
            suspendedListings,
            flaggedReviews,
            openReports,
            pendingAppeals,
            openDisputes,
            blockedIps,
            multiReportedUsers,
            pendingBrands,
        ] = await Promise.all([
            // Users: Pending identity verifications
            this.prisma.user.count({ where: { verificationStatus: 'PENDING' } }),
            // Users: Suspended users (may need attention)
            this.prisma.user.count({ where: { status: 'suspended' } }),
            // Listings: Suspended listings
            this.prisma.listing.count({ where: { status: 'suspended' } }),
            // Reviews: Flagged reviews needing moderation
            this.prisma.review.count({ where: { flagged: true } }),
            // Reports: Open/pending reports
            this.prisma.report.count({ where: { status: 'open' } }),
            // Appeals: Pending appeals
            this.prisma.appeal.count({ where: { status: 'pending' } }),
            // Disputes: Open/under_review disputes
            this.prisma.dispute.count({ where: { status: { in: ['open', 'under_review'] } } }),
            // Security: Blocked IPs count
            this.prisma.blockedIp.count(),
            // Users with 2+ reports against them (potential scammers)
            this.prisma.$queryRaw`
                SELECT COUNT(DISTINCT u.id)::int as count
                FROM users u
                WHERE (
                    SELECT COUNT(*) FROM reports r WHERE r.reported_user_id = u.id
                ) >= 2
                OR (
                    SELECT COUNT(*) FROM reports r 
                    JOIN listings l ON r.listing_id = l.id 
                    WHERE l.seller_id = u.id
                ) >= 2
            `,
            // Brands: Pending brand verification applications
            this.prisma.user.count({ where: { brandVerificationStatus: 'PENDING' } }),
        ]);

        // Extract count from raw query result
        const multiReportedCount = (multiReportedUsers as any[])?.[0]?.count || 0;

        const data = {
            users: pendingVerifications + multiReportedCount, // Users needing attention
            listings: suspendedListings,
            reviews: flaggedReviews,
            reports: openReports,
            appeals: pendingAppeals,
            disputes: openDisputes,
            security: blockedIps,
            pendingBrands,
            // Detailed breakdown for dashboard if needed
            breakdown: {
                pendingVerifications,
                suspendedUsers,
                suspendedListings,
                flaggedReviews,
                openReports,
                openDisputes,
                pendingAppeals,
                blockedIps,
                multiReportedUsers: multiReportedCount,
            }
        };

        // Update cache
        this.sidebarStatsCache = {
            data,
            lastUpdated: Date.now(),
        };

        return data;
    }

    async getConversationMessages(conversationId: string) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                buyer: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
                seller: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
                listing: { select: { id: true, title: true } },
            },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        const messages = await this.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
        });

        return {
            conversation,
            messages: messages.map(msg => ({
                id: msg.id,
                senderId: msg.senderId,
                content: msg.body,
                timestamp: msg.createdAt.getTime(),
                type: msg.messageType,
                mediaUrl: msg.mediaUrl,
                mediaType: msg.mediaType,
            })),
        };
    }

    // ==========================================
    // MONETIZATION ANALYTICS
    // ==========================================

    async getRevenueStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch purchases by currency
        const [
            purchaseRevenueNGN,
            purchaseRevenueUSD,
            todayPurchaseRevenueNGN,
            todayPurchaseRevenueUSD,
            activeSubscribers,
            totalTransactions,
        ] = await Promise.all([
            // Total NGN
            this.prisma.purchase.aggregate({
                where: { status: 'completed', currency: 'NGN' },
                _sum: { amountCents: true },
            }),
            // Total USD
            this.prisma.purchase.aggregate({
                where: { status: 'completed', currency: 'USD' },
                _sum: { amountCents: true },
            }),
            // Today NGN
            this.prisma.purchase.aggregate({
                where: {
                    status: 'completed',
                    currency: 'NGN',
                    createdAt: { gte: today },
                },
                _sum: { amountCents: true },
            }),
            // Today USD
            this.prisma.purchase.aggregate({
                where: {
                    status: 'completed',
                    currency: 'USD',
                    createdAt: { gte: today },
                },
                _sum: { amountCents: true },
            }),
            // Active Subscribers (Assuming NGN for legacy, but usually Empire Status is tracked here)
            this.prisma.subscription.count({
                where: { status: 'active' },
            }),
            // Total transactions
            this.prisma.purchase.count({
                where: { status: 'completed' },
            }),
        ]);

        return {
            totalGrossRevenueNGN: (purchaseRevenueNGN._sum.amountCents || 0) / 100,
            totalGrossRevenueUSD: (purchaseRevenueUSD._sum.amountCents || 0) / 100,
            todayRevenueNGN: (todayPurchaseRevenueNGN._sum.amountCents || 0) / 100,
            todayRevenueUSD: (todayPurchaseRevenueUSD._sum.amountCents || 0) / 100,
            activeSubscribers,
            totalTransactions,
        };
    }

    async getTransactions(query: { type?: string; page?: number; limit?: number }) {
        const { type, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: any = { status: 'completed' };
        if (type) {
            where.type = type;
        }

        const [purchases, total] = await Promise.all([
            this.prisma.purchase.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            profile: { select: { displayName: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.purchase.count({ where }),
        ]);

        // Human-readable type names
        const typeLabels: Record<string, string> = {
            chat_pass: 'Chat Pass (Monthly)',
            cross_list: 'Cross-List Boost',
            aggressive_boost: 'Aggressive Boost',
            spotlight_3: 'Spotlight (3 Days)',
            spotlight_7: 'Spotlight (7 Days)',
            premium: 'Premium Subscription',
        };

        return {
            data: purchases.map((p) => ({
                id: p.id,
                date: p.createdAt,
                userEmail: p.user.email,
                userName: p.user.profile?.displayName || p.user.email,
                type: p.type,
                typeLabel: typeLabels[p.type] || p.type,
                amountCents: p.amountCents,
                amount: p.amountCents / 100,
                currency: p.currency,
                paystackRef: p.paystackRef,
                listingId: p.listingId,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getActiveSpotlights() {
        const now = new Date();

        const spotlightListings = await this.prisma.listing.findMany({
            where: {
                OR: [
                    { isFeatured: true },
                    { spotlightExpiry: { gt: now } },
                ],
                status: 'active',
            },
            include: {
                seller: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { displayName: true } },
                    },
                },
                images: {
                    orderBy: { sortOrder: 'asc' },
                    take: 1,
                },
            },
            orderBy: { spotlightExpiry: 'desc' },
        });

        return spotlightListings.map((listing) => ({
            id: listing.id,
            title: listing.title,
            image: listing.images[0]?.url,
            sellerEmail: listing.seller.email,
            sellerName: listing.seller.profile?.displayName || listing.seller.email,
            isFeatured: listing.isFeatured,
            spotlightExpiry: listing.spotlightExpiry,
            isDistressSale: listing.isDistressSale,
            isCrossListed: listing.isCrossListed,
            priceCents: listing.priceCents ? Number(listing.priceCents) : null,
        }));
    }

    async removeSpotlight(listingId: string, adminId: string) {
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId },
        });

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        const updated = await this.prisma.listing.update({
            where: { id: listingId },
            data: {
                isFeatured: false,
                spotlightExpiry: null,
                isCrossListed: false,
            },
        });

        // Audit log
        await this.auditService.log(
            adminId,
            'REMOVE_SPOTLIGHT',
            undefined,
            {
                listingId,
                listingTitle: listing.title,
                sellerId: listing.sellerId,
            }
        );

        return { success: true, message: 'Spotlight removed from listing' };
    }

    // =====================
    // TRADE MONITORING
    // =====================

    async getTrades(query: {
        status?: string;
        downpaymentStatus?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (query.status) {
            where.status = query.status;
        }

        if (query.downpaymentStatus) {
            where.downpaymentStatus = query.downpaymentStatus;
        }

        if (query.search) {
            where.OR = [
                { listing: { title: { contains: query.search, mode: 'insensitive' } } },
                { buyer: { email: { contains: query.search, mode: 'insensitive' } } },
                { seller: { email: { contains: query.search, mode: 'insensitive' } } },
                { buyer: { profile: { displayName: { contains: query.search, mode: 'insensitive' } } } },
                { seller: { profile: { displayName: { contains: query.search, mode: 'insensitive' } } } },
            ];
        }

        const [trades, total] = await Promise.all([
            this.prisma.barterOffer.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    listing: {
                        include: {
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
            }),
            this.prisma.barterOffer.count({ where }),
        ]);

        return {
            data: trades.map(t => ({
                ...t,
                offeredCashCents: t.offeredCashCents ? Number(t.offeredCashCents) : 0,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // =====================
    // USER VERIFICATION TOGGLE
    // =====================

    async toggleUserVerification(userId: string, verified: boolean) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                isVerified: verified,
                verificationStatus: verified ? 'VERIFIED' : 'NONE',
            },
            include: { profile: true },
        });

        return {
            id: updated.id,
            email: updated.email,
            isVerified: updated.isVerified,
            verificationStatus: updated.verificationStatus,
        };
    }
}
