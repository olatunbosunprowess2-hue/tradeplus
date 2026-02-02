import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DisputesService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    async create(userId: string, createDisputeDto: CreateDisputeDto) {
        const { orderId, reason, description, evidenceImages } = createDisputeDto;

        // 1. Verify order exists
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                buyer: true,
                seller: true,
                escrowTransaction: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // 2. Verify user is part of this order
        if (order.buyerId !== userId && order.sellerId !== userId) {
            throw new ForbiddenException('You can only file disputes for your own orders');
        }

        // 3. Check if dispute already exists for this order
        const existingDispute = await this.prisma.dispute.findFirst({
            where: { orderId, status: { in: ['open', 'under_review'] } },
        });

        if (existingDispute) {
            throw new BadRequestException('An active dispute already exists for this order');
        }

        // 4. Create dispute
        const dispute = await this.prisma.dispute.create({
            data: {
                orderId,
                reporterId: userId,
                reason,
                description,
                evidenceImages: evidenceImages || [],
            },
            include: {
                order: {
                    select: {
                        id: true,
                        status: true,
                        buyer: { select: { id: true, email: true } },
                        seller: { select: { id: true, email: true } },
                    },
                },
                reporter: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { displayName: true } },
                    },
                },
            },
        });



        // 6. Notify the other party
        const otherPartyId = order.buyerId === userId ? order.sellerId : order.buyerId;
        await this.notificationsService.create(otherPartyId, 'DISPUTE_FILED', {
            disputeId: dispute.id,
            orderId: order.id,
            reason,
        });

        return dispute;
    }

    async findAll(status?: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;
        const where = status ? { status } : {};

        const [disputes, total] = await Promise.all([
            this.prisma.dispute.findMany({
                where,
                skip,
                take: limit,
                include: {
                    order: {
                        select: {
                            id: true,
                            status: true,
                            totalPriceCents: true,
                            currencyCode: true,
                        },
                    },
                    reporter: {
                        select: {
                            id: true,
                            email: true,
                            profile: { select: { displayName: true, avatarUrl: true } },
                        },
                    },
                    resolvedBy: {
                        select: {
                            id: true,
                            email: true,
                            profile: { select: { displayName: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.dispute.count({ where }),
        ]);

        return {
            data: disputes,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }


    async findOne(id: string) {
        const dispute = await this.prisma.dispute.findUnique({
            where: { id },
            include: {
                order: {
                    include: {
                        buyer: {
                            select: {
                                id: true,
                                email: true,
                                profile: { select: { displayName: true, avatarUrl: true } },
                            },
                        },
                        seller: {
                            select: {
                                id: true,
                                email: true,
                                profile: { select: { displayName: true, avatarUrl: true } },
                            },
                        },
                        items: {
                            include: {
                                listing: {
                                    select: { id: true, title: true, images: { take: 1 } },
                                },
                            },
                        },
                        escrowTransaction: true,
                    },
                },
                reporter: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { displayName: true, avatarUrl: true } },
                    },
                },
                resolvedBy: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { displayName: true } },
                    },
                },
            },
        });

        if (!dispute) {
            throw new NotFoundException('Dispute not found');
        }

        return dispute;
    }

    async findByUser(userId: string) {
        return this.prisma.dispute.findMany({
            where: { reporterId: userId },
            include: {
                order: {
                    select: {
                        id: true,
                        status: true,
                        totalPriceCents: true,
                        currencyCode: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async resolve(id: string, adminId: string, resolveDisputeDto: ResolveDisputeDto) {
        const dispute = await this.prisma.dispute.findUnique({
            where: { id },
            include: {
                order: {
                    include: { escrowTransaction: true },
                },
            },
        });

        if (!dispute) {
            throw new NotFoundException('Dispute not found');
        }

        if (dispute.status === 'resolved' || dispute.status === 'rejected') {
            throw new BadRequestException('Dispute is already resolved');
        }

        const { resolution, adminNotes } = resolveDisputeDto;

        // Update dispute
        const updated = await this.prisma.dispute.update({
            where: { id },
            data: {
                status: 'resolved',
                resolution,
                adminNotes,
                resolvedById: adminId,
                resolvedAt: new Date(),
            },
        });



        // If resolution is full_refund, rollback the trade
        if (resolution === 'full_refund') {
            await this.reverseTrade(dispute.orderId);
        }

        // Notify reporter
        await this.notificationsService.create(dispute.reporterId, 'DISPUTE_RESOLVED', {
            disputeId: dispute.id,
            resolution,
        });

        return updated;
    }

    private async reverseTrade(orderId: string) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Fetch order with items
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true, escrowTransaction: true }
            });

            if (!order) return;

            // 2. Rollback item quantities and listing status
            for (const item of order.items) {
                await tx.listing.update({
                    where: { id: item.listingId },
                    data: {
                        quantity: { increment: item.quantity },
                        status: 'active' // Ensure it's active again if it was 'sold'
                    }
                });
            }

            // 3. Handle Escrow (if any)
            if (order.escrowTransaction) {
                await tx.escrowTransaction.update({
                    where: { id: order.escrowTransaction.id },
                    data: { status: 'refunded', refundedAt: new Date() }
                });
            }

            // 4. Update order status
            await tx.order.update({
                where: { id: orderId },
                data: { status: 'cancelled', paymentStatus: 'refunded' }
            });
        });
    }

    async getStats() {
        const [open, underReview, resolved, rejected] = await Promise.all([
            this.prisma.dispute.count({ where: { status: 'open' } }),
            this.prisma.dispute.count({ where: { status: 'under_review' } }),
            this.prisma.dispute.count({ where: { status: 'resolved' } }),
            this.prisma.dispute.count({ where: { status: 'rejected' } }),
        ]);

        return { open, underReview, resolved, rejected, total: open + underReview + resolved + rejected };
    }
}
