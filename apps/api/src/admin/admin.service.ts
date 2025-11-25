import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AdminListingQueryDto } from './dto/admin-listing-query.dto';
import { UpdateListingStatusDto } from './dto/update-listing-status.dto';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async getUsers(query: AdminUserQueryDto) {
        const { search, role, status, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { profile: { displayName: { contains: search, mode: 'insensitive' } } },
            ];
        }

        if (role) {
            where.role = role;
        }

        if (status) {
            where.status = status;
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
                const { passwordHash, ...userWithoutPassword } = user;
                return userWithoutPassword;
            }),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async updateUserStatus(id: string, dto: UpdateUserStatusDto) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const updated = await this.prisma.user.update({
            where: { id },
            data: { status: dto.status },
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
        ]);

        return {
            users: {
                total: totalUsers,
                active: activeUsers,
                suspended: suspendedUsers,
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
