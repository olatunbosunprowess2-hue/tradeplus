import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { InitiateEscrowDto, PaymentProvider } from './dto/initiate-escrow.dto';
import { ConfirmEscrowDto } from './dto/confirm-escrow.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface EscrowFees {
    itemPriceCents: bigint;
    protectionFeeCents: bigint;
    commissionCents: bigint;
    totalPaidCents: bigint;
    sellerReceivesCents: bigint;
    protectionFeePercent: number;
    commissionPercent: number;
}

@Injectable()
export class EscrowService {
    private readonly logger = new Logger(EscrowService.name);

    constructor(
        private prisma: PrismaService,
        private notifications: NotificationsService,
        private emailService: EmailService,
    ) { }

    /**
     * Calculate escrow fees based on item price (distress sale fee structure)
     */
    calculateFees(itemPriceCents: bigint): EscrowFees {
        const price = Number(itemPriceCents);
        let protectionFeePercent: number;
        let commissionPercent: number;

        // Tiered fee structure for distress sales
        if (price < 10_000_000) { // < ₦100,000
            protectionFeePercent = 1.5;
            commissionPercent = 5;
        } else if (price < 50_000_000) { // < ₦500,000
            protectionFeePercent = 1.0;
            commissionPercent = 5;
        } else { // ₦500,000+
            // Flat ₦5,000 protection fee for high-value items
            const protectionFeeCents = BigInt(500_000); // ₦5,000 in cents
            commissionPercent = 4;
            const commissionCents = BigInt(Math.floor(price * commissionPercent / 100));

            return {
                itemPriceCents,
                protectionFeeCents,
                commissionCents,
                totalPaidCents: itemPriceCents + protectionFeeCents,
                sellerReceivesCents: itemPriceCents - commissionCents,
                protectionFeePercent: Number(protectionFeeCents) / price * 100,
                commissionPercent,
            };
        }

        // Calculate protection fee with minimum ₦500
        let protectionFeeCents = BigInt(Math.floor(price * protectionFeePercent / 100));
        const minProtectionFee = BigInt(50_000); // ₦500 minimum
        if (protectionFeeCents < minProtectionFee) {
            protectionFeeCents = minProtectionFee;
        }

        const commissionCents = BigInt(Math.floor(price * commissionPercent / 100));

        return {
            itemPriceCents,
            protectionFeeCents,
            commissionCents,
            totalPaidCents: itemPriceCents + protectionFeeCents,
            sellerReceivesCents: itemPriceCents - commissionCents,
            protectionFeePercent,
            commissionPercent,
        };
    }

    /**
     * Generate a random 6-digit confirmation code
     */
    private generateConfirmationCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Initiate an escrow transaction for a distress sale
     */
    async initiateEscrow(buyerId: string, dto: InitiateEscrowDto) {
        this.logger.log(`Initiating escrow: buyer=${buyerId}, listing=${dto.listingId}`);

        // Get the listing
        const listing = await this.prisma.listing.findUnique({
            where: { id: dto.listingId },
            include: { seller: { include: { profile: true } } },
        });

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        if (!listing.isDistressSale) {
            throw new BadRequestException('This listing is not a distress sale. Escrow is only available for distress sales.');
        }

        if (listing.sellerId === buyerId) {
            throw new BadRequestException('You cannot buy your own listing');
        }

        if (!listing.priceCents || listing.priceCents <= 0) {
            throw new BadRequestException('Listing must have a valid price for escrow');
        }

        if (listing.status !== 'active') {
            throw new BadRequestException('Listing is not available');
        }

        // Calculate fees
        const fees = this.calculateFees(listing.priceCents);

        // Create order first
        const order = await this.prisma.order.create({
            data: {
                buyerId,
                sellerId: listing.sellerId,
                totalPriceCents: fees.itemPriceCents,
                currencyCode: listing.currencyCode,
                status: 'pending',
                paymentStatus: 'pending',
                shippingMethod: dto.shippingMethod || 'meet_in_person',
                items: {
                    create: [{
                        listingId: listing.id,
                        quantity: 1,
                        priceCents: listing.priceCents,
                        dealType: 'cash',
                    }],
                },
            },
        });

        // Create escrow transaction
        const confirmationCode = this.generateConfirmationCode();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour window

        const escrow = await this.prisma.escrowTransaction.create({
            data: {
                orderId: order.id,
                itemPriceCents: fees.itemPriceCents,
                protectionFeeCents: fees.protectionFeeCents,
                commissionCents: fees.commissionCents,
                totalPaidCents: fees.totalPaidCents,
                sellerReceivesCents: fees.sellerReceivesCents,
                currencyCode: listing.currencyCode,
                status: 'pending',
                confirmationCode,
                paymentProvider: dto.paymentProvider || 'mock',
                expiresAt,
            },
        });

        // For mock payments, simulate immediate payment success
        if (dto.paymentProvider === PaymentProvider.MOCK) {
            await this.handlePaymentSuccess(escrow.id, 'MOCK_' + Date.now());
        }

        // Fetch complete data
        const result = await this.getEscrowByOrderId(order.id);

        return {
            ...result,
            fees: {
                itemPrice: Number(fees.itemPriceCents) / 100,
                protectionFee: Number(fees.protectionFeeCents) / 100,
                commission: Number(fees.commissionCents) / 100,
                totalToPay: Number(fees.totalPaidCents) / 100,
                sellerReceives: Number(fees.sellerReceivesCents) / 100,
            },
        };
    }

    /**
     * Handle successful payment (called by webhook or mock)
     */
    async handlePaymentSuccess(escrowId: string, paymentReference: string) {
        this.logger.log(`Payment success: escrow=${escrowId}, ref=${paymentReference}`);

        const escrow = await this.prisma.escrowTransaction.update({
            where: { id: escrowId },
            data: {
                status: 'held',
                paymentStatus: 'success',
                paymentReference,
                paidAt: new Date(),
            },
            include: {
                order: {
                    include: {
                        buyer: { include: { profile: true } },
                        seller: { include: { profile: true } },
                        items: { include: { listing: true } },
                    },
                },
            },
        });

        // Update order status
        await this.prisma.order.update({
            where: { id: escrow.orderId },
            data: { paymentStatus: 'paid', status: 'paid' },
        });

        // Notify seller: Funds are secured, safe to meet buyer
        await this.notifications.create(escrow.order.sellerId, 'ESCROW_HELD', {
            message: `💰 Funds secured! ₦${(Number(escrow.itemPriceCents) / 100).toLocaleString()} is held safely. You can now meet the buyer.`,
            orderId: escrow.orderId,
            listingTitle: escrow.order.items[0]?.listing?.title,
        });

        // Notify buyer: Payment received, here's your confirmation code
        await this.notifications.create(escrow.order.buyerId, 'ESCROW_CODE', {
            message: `✅ Payment received! Your confirmation code is: ${escrow.confirmationCode}. Share this with the seller ONLY after you receive the item.`,
            orderId: escrow.orderId,
            confirmationCode: escrow.confirmationCode,
        });

        // Send email notification to seller
        const sellerEmail = escrow.order.seller.email;
        const sellerName = escrow.order.seller.profile?.displayName || '';
        const buyerName = escrow.order.buyer.profile?.displayName || escrow.order.buyer.email;
        const itemTitle = escrow.order.items[0]?.listing?.title || 'Item';
        this.emailService.sendEscrowPaymentReceived(
            sellerEmail,
            sellerName,
            buyerName,
            itemTitle,
            Number(escrow.itemPriceCents) / 100,
            escrow.currencyCode || 'NGN',
        );

        return escrow;
    }

    /**
     * Buyer confirms receipt and releases funds to seller
     */
    async confirmReceipt(buyerId: string, dto: ConfirmEscrowDto) {
        this.logger.log(`Confirming receipt: buyer=${buyerId}, order=${dto.orderId}`);

        const escrow = await this.prisma.escrowTransaction.findUnique({
            where: { orderId: dto.orderId },
            include: { order: true },
        });

        if (!escrow) {
            throw new NotFoundException('Escrow transaction not found');
        }

        if (escrow.order.buyerId !== buyerId) {
            throw new ForbiddenException('Only the buyer can confirm receipt');
        }

        if (escrow.status !== 'held') {
            throw new BadRequestException(`Cannot confirm: escrow status is ${escrow.status}`);
        }

        if (escrow.confirmationCode !== dto.confirmationCode) {
            throw new BadRequestException('Invalid confirmation code');
        }

        // Release funds
        const updated = await this.prisma.escrowTransaction.update({
            where: { id: escrow.id },
            data: {
                status: 'released',
                confirmedAt: new Date(),
                releasedAt: new Date(),
            },
            include: {
                order: {
                    include: {
                        buyer: { include: { profile: true } },
                        seller: { include: { profile: true } },
                        items: { include: { listing: true } },
                    },
                },
            },
        });

        // Update order status
        await this.prisma.order.update({
            where: { id: escrow.orderId },
            data: { status: 'fulfilled' },
        });

        // Update listing status to sold
        if (updated.order.items[0]?.listingId) {
            await this.prisma.listing.update({
                where: { id: updated.order.items[0].listingId },
                data: { status: 'sold' },
            });
        }

        // Notify seller: Payment released!
        const sellerAmount = Number(updated.sellerReceivesCents) / 100;
        await this.notifications.create(updated.order.sellerId, 'ESCROW_RELEASED', {
            message: `🎉 Payment released! ₦${sellerAmount.toLocaleString()} has been sent to your account.`,
            orderId: updated.orderId,
            amount: sellerAmount,
        });

        // Notify buyer: Transaction complete
        await this.notifications.create(updated.order.buyerId, 'ESCROW_COMPLETE', {
            message: `✅ Transaction complete! Thank you for your purchase.`,
            orderId: updated.orderId,
        });

        // Send email notification to seller
        const sellerEmail = updated.order.seller.email;
        const sellerName = updated.order.seller.profile?.displayName || '';
        const itemTitle = updated.order.items[0]?.listing?.title || 'Item';
        this.emailService.sendEscrowReleased(
            sellerEmail,
            sellerName,
            itemTitle,
            sellerAmount,
            updated.currencyCode || 'NGN',
        );

        return {
            success: true,
            message: 'Funds released to seller',
            sellerReceives: sellerAmount,
        };
    }

    /**
     * Get escrow status by order ID
     */
    async getEscrowByOrderId(orderId: string) {
        const escrow = await this.prisma.escrowTransaction.findUnique({
            where: { orderId },
            include: {
                order: {
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
                },
            },
        });

        if (!escrow) {
            throw new NotFoundException('Escrow transaction not found');
        }

        return {
            id: escrow.id,
            orderId: escrow.orderId,
            status: escrow.status,
            paymentStatus: escrow.paymentStatus,
            confirmationCode: escrow.confirmationCode,
            itemPrice: Number(escrow.itemPriceCents) / 100,
            protectionFee: Number(escrow.protectionFeeCents) / 100,
            commission: Number(escrow.commissionCents) / 100,
            totalPaid: Number(escrow.totalPaidCents) / 100,
            sellerReceives: Number(escrow.sellerReceivesCents) / 100,
            currencyCode: escrow.currencyCode,
            expiresAt: escrow.expiresAt,
            paidAt: escrow.paidAt,
            confirmedAt: escrow.confirmedAt,
            releasedAt: escrow.releasedAt,
            order: {
                id: escrow.order.id,
                buyer: escrow.order.buyer,
                seller: escrow.order.seller,
                items: escrow.order.items,
                status: escrow.order.status,
            },
        };
    }

    /**
     * Refund expired escrows (run hourly)
     */
    @Cron(CronExpression.EVERY_HOUR)
    async handleExpiredEscrows() {
        this.logger.log('Checking for expired escrows...');

        const expired = await this.prisma.escrowTransaction.findMany({
            where: {
                status: 'held',
                expiresAt: { lt: new Date() },
            },
            include: { order: true },
        });

        for (const escrow of expired) {
            this.logger.log(`Refunding expired escrow: ${escrow.id}`);

            await this.prisma.escrowTransaction.update({
                where: { id: escrow.id },
                data: {
                    status: 'expired',
                    refundedAt: new Date(),
                },
            });

            await this.prisma.order.update({
                where: { id: escrow.orderId },
                data: { status: 'cancelled', paymentStatus: 'refunded' },
            });

            // Notify buyer: Refunded (minus protection fee)
            const refundAmount = Number(escrow.itemPriceCents) / 100;
            await this.notifications.create(escrow.order.buyerId, 'ESCROW_EXPIRED', {
                message: `⏰ Escrow expired. ₦${refundAmount.toLocaleString()} has been refunded. (Protection fee retained)`,
                orderId: escrow.orderId,
            });

            // Notify seller: Sale cancelled
            await this.notifications.create(escrow.order.sellerId, 'ESCROW_EXPIRED', {
                message: `⏰ Sale cancelled: Buyer did not confirm receipt within 24 hours.`,
                orderId: escrow.orderId,
            });
        }

        if (expired.length > 0) {
            this.logger.log(`Refunded ${expired.length} expired escrows`);
        }
    }
}
