import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AdminListingQueryDto } from './dto/admin-listing-query.dto';
import { UpdateListingStatusDto } from './dto/update-listing-status.dto';

import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
        private emailService: EmailService,
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
                    idDocumentFrontUrl,
                    idDocumentBackUrl,
                    faceVerificationUrl,
                    idDocumentType,
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

    async updateUserStatus(id: string, dto: UpdateUserStatusDto, adminMessage?: string) {
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
                    timestamp: new Date()
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
                    timestamp: new Date()
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
                        timestamp: new Date()
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
                        timestamp: new Date()
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
                        timestamp: new Date()
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

    async updateListingStatus(id: string, dto: UpdateListingStatusDto) {
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

        return {
            ...updated,
            priceCents: updated.priceCents ? Number(updated.priceCents) : null,
        };
    }

    async getReports() {
        const reports = await this.prisma.report.findMany({
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
                message: true,
                resolvedByAdmin: {
                    include: { profile: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return reports;
    }

    async getStats() {
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

        return {
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
    }
}
