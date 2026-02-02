import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MonetizationService } from '../monetization/monetization.service';
import { PRICING, PURCHASE_TYPES, PurchaseType, Currency, getPrice } from '../monetization/pricing.constants';

interface PaystackInitResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

@Injectable()
export class PaymentsService {
    private readonly paystackSecretKey: string;
    private readonly paystackBaseUrl = 'https://api.paystack.co';

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
        private monetizationService: MonetizationService,
    ) {
        this.paystackSecretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    }

    /**
     * Initialize a Paystack transaction
     */
    async initializeTransaction(
        userId: string,
        email: string,
        type: PurchaseType,
        listingId?: string,
        currency: Currency = 'NGN',
    ): Promise<{ authorizationUrl: string; reference: string }> {
        // Determine amount based on type and currency
        let amount = getPrice(type, currency);

        // Check if premium for discounted boost (only for NGN for now, or unified logic)
        const isPremium = await this.monetizationService.isPremium(userId);

        if (type === PURCHASE_TYPES.AGGRESSIVE_BOOST && isPremium) {
            amount = getPrice('AGGRESSIVE_BOOST_PREMIUM' as any, currency);
        }

        // Generate unique reference
        const reference = `BW_${type}_${userId.slice(0, 8)}_${Date.now()}`;

        // Create pending purchase record
        await this.prisma.purchase.create({
            data: {
                userId,
                type,
                amountCents: amount,
                currency,
                listingId,
                paystackRef: reference,
                status: 'pending',
            },
        });

        // Call Paystack API
        const response = await fetch(`${this.paystackBaseUrl}/transaction/initialize`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.paystackSecretKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                amount,
                currency,
                reference,
                callback_url: `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/payment/callback`,
                metadata: {
                    userId,
                    type,
                    listingId,
                    currency,
                },
            }),
        });

        const data: PaystackInitResponse = await response.json();

        if (!data.status) {
            throw new BadRequestException(data.message || 'Failed to initialize payment');
        }

        return {
            authorizationUrl: data.data.authorization_url,
            reference: data.data.reference,
        };
    }

    /**
     * Verify a transaction and process the purchase
     */
    async verifyAndProcessTransaction(reference: string): Promise<{ success: boolean; message?: string }> {
        // Find the purchase record
        const purchase = await this.prisma.purchase.findFirst({
            where: { paystackRef: reference },
        });

        if (!purchase) {
            console.error(`Purchase not found for reference: ${reference}`);
            return { success: false, message: 'Transaction record not found.' };
        }

        if (purchase.status === 'completed') {
            return { success: true, message: 'This transaction was already completed.' };
        }

        // Verify with Paystack
        const response = await fetch(`${this.paystackBaseUrl}/transaction/verify/${reference}`, {
            headers: {
                'Authorization': `Bearer ${this.paystackSecretKey}`,
            },
        });

        const data = await response.json();

        if (!data.status || data.data.status !== 'success') {
            await this.prisma.purchase.update({
                where: { id: purchase.id },
                data: { status: 'failed' },
            });
            return { success: false, message: 'Payment verification failed.' };
        }

        // Process the purchase based on type
        const result = await this.processPurchase(purchase);

        // Mark as completed
        await this.prisma.purchase.update({
            where: { id: purchase.id },
            data: { status: 'completed' },
        });

        return { success: true, message: result?.message };
    }

    /**
     * Process a successful purchase
     */
    private async processPurchase(purchase: any): Promise<{ success: boolean; message: string } | void> {
        switch (purchase.type) {
            case PURCHASE_TYPES.CHAT_PASS:
                return await this.monetizationService.activateChatPass(purchase.userId);

            case PURCHASE_TYPES.CROSS_LIST:
                if (purchase.listingId) {
                    return await this.monetizationService.activateCrossList(purchase.listingId);
                }
                break;

            case PURCHASE_TYPES.AGGRESSIVE_BOOST:
                if (purchase.listingId) {
                    return await this.monetizationService.activateAggressiveBoost(purchase.listingId);
                }
                break;

            case PURCHASE_TYPES.SPOTLIGHT_3:
                if (purchase.listingId) {
                    return await this.monetizationService.activateSpotlight(purchase.listingId, 3);
                }
                break;

            case PURCHASE_TYPES.SPOTLIGHT_7:
                if (purchase.listingId) {
                    return await this.monetizationService.activateSpotlight(purchase.listingId, 7);
                }
                break;

            case PURCHASE_TYPES.PREMIUM:
                return await this.monetizationService.upgradeToPremium(purchase.userId);
        }
    }

    /**
     * Handle Paystack webhook events
     */
    async handleWebhook(event: any): Promise<void> {
        if (event.event === 'charge.success') {
            const reference = event.data.reference;
            await this.verifyAndProcessTransaction(reference);
        }

        if (event.event === 'subscription.create' || event.event === 'invoice.payment_failed') {
            // Handle subscription events if needed
            console.log('Subscription event:', event.event, event.data);
        }
    }
}
