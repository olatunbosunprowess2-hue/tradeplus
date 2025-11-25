import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    async create(userId: string, dto: CreateOrderDto) {
        // Validate all listings exist and calculate total
        let totalPriceCents = BigInt(0);
        let sellerId: string | null = null;
        const currencyCode = 'USD'; // Default, should be from first listing

        for (const item of dto.items) {
            const listing = await this.prisma.listing.findUnique({
                where: { id: item.listingId },
            });

            if (!listing) {
                throw new NotFoundException(`Listing ${item.listingId} not found`);
            }

            if (listing.sellerId === userId) {
                throw new BadRequestException('Cannot buy your own listing');
            }

            // All items must be from the same seller
            if (sellerId === null) {
                sellerId = listing.sellerId;
            } else if (sellerId !== listing.sellerId) {
                throw new BadRequestException('All items must be from the same seller');
            }

            // Calculate price based on deal type
            if (item.dealType === 'cash' || item.dealType === 'cash_plus_barter') {
                if (!listing.priceCents) {
                    throw new BadRequestException(`Listing ${item.listingId} has no price`);
                }
                totalPriceCents += listing.priceCents * BigInt(item.quantity);
            }
        }

        if (!sellerId) {
            throw new BadRequestException('No valid seller found');
        }

        // Create the order
        const order = await this.prisma.order.create({
            data: {
                buyerId: userId,
                sellerId,
                totalPriceCents,
                currencyCode,
                shippingMethod: dto.shippingMethod,
                barterOfferId: dto.barterOfferId,
                items: {
                    create: dto.items.map((item) => ({
                        listingId: item.listingId,
                        quantity: item.quantity,
                        priceCents: BigInt(0), // Will be updated based on listing price
                        dealType: item.dealType,
                        barterOfferId: item.barterOfferId,
                    })),
                },
            },
            include: {
                buyer: { include: { profile: true } },
                seller: { include: { profile: true } },
                items: {
                    include: {
                        listing: {
                            include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
                        },
                    },
                },
                barterOffer: true,
            },
        });

        // Send Notification
        const formattedPrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
        }).format(Number(totalPriceCents) / 100);

        await this.notificationsService.create(sellerId, 'NEW_ORDER', {
            title: 'New Order Received!',
            message: `You sold items for ${formattedPrice}`,
            orderId: order.id,
        });

        return {
            ...order,
            totalPriceCents: Number(order.totalPriceCents),
            items: order.items.map((item) => ({
                ...item,
                priceCents: Number(item.priceCents),
            })),
        };
    }

    async findAll(userId: string, query: OrderQueryDto) {
        const where: any = {};

        if (query.type === 'bought') {
            where.buyerId = userId;
        } else if (query.type === 'sold') {
            where.sellerId = userId;
        } else {
            // Both bought and sold
            where.OR = [{ buyerId: userId }, { sellerId: userId }];
        }

        if (query.status) {
            where.status = query.status;
        }

        const orders = await this.prisma.order.findMany({
            where,
            include: {
                buyer: { include: { profile: true } },
                seller: { include: { profile: true } },
                items: {
                    include: {
                        listing: {
                            include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
                        },
                    },
                },
                barterOffer: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return orders.map((order) => ({
            ...order,
            totalPriceCents: Number(order.totalPriceCents),
            items: order.items.map((item) => ({
                ...item,
                priceCents: Number(item.priceCents),
            })),
        }));
    }

    async findOne(id: string, userId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                buyer: { include: { profile: true } },
                seller: { include: { profile: true } },
                items: {
                    include: {
                        listing: {
                            include: { images: { orderBy: { sortOrder: 'asc' } } },
                        },
                    },
                },
                barterOffer: {
                    include: {
                        items: {
                            include: {
                                offeredListing: {
                                    include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
                                },
                            },
                        },
                    },
                },
                payments: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Verify user is involved in this order
        if (order.buyerId !== userId && order.sellerId !== userId) {
            throw new ForbiddenException('You do not have access to this order');
        }

        return {
            ...order,
            totalPriceCents: Number(order.totalPriceCents),
            items: order.items.map((item) => ({
                ...item,
                priceCents: Number(item.priceCents),
            })),
            payments: order.payments.map((payment) => ({
                ...payment,
                amountCents: Number(payment.amountCents),
            })),
        };
    }

    async updateStatus(id: string, userId: string, dto: UpdateOrderStatusDto) {
        const order = await this.prisma.order.findUnique({
            where: { id },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Only seller can update order status
        if (order.sellerId !== userId) {
            throw new ForbiddenException('Only the seller can update order status');
        }

        const updated = await this.prisma.order.update({
            where: { id },
            data: { status: dto.status },
            include: {
                buyer: { include: { profile: true } },
                seller: { include: { profile: true } },
                items: {
                    include: {
                        listing: {
                            include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
                        },
                    },
                },
            },
        });

        // Send Notification
        await this.notificationsService.create(updated.buyerId, 'ORDER_UPDATE', {
            title: 'Order Update',
            message: `Your order status is now ${dto.status}`,
            orderId: updated.id,
        });

        return {
            ...updated,
            totalPriceCents: Number(updated.totalPriceCents),
            items: updated.items.map((item) => ({
                ...item,
                priceCents: Number(item.priceCents),
            })),
        };
    }
}
