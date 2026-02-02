import {
    Controller,
    Post,
    Body,
    UseGuards,
    Headers,
    RawBodyRequest,
    Req,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { PURCHASE_TYPES, PurchaseType, Currency } from '../monetization/pricing.constants';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

class InitializePaymentDto {
    type: PurchaseType;
    listingId?: string;
    currency?: Currency;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
    constructor(
        private paymentsService: PaymentsService,
        private configService: ConfigService,
    ) { }

    @Post('initialize')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Initialize a payment transaction' })
    async initializePayment(
        @CurrentUser() user: any,
        @Body() dto: InitializePaymentDto,
    ) {
        // Validate purchase type
        if (!Object.values(PURCHASE_TYPES).includes(dto.type)) {
            throw new BadRequestException('Invalid purchase type');
        }

        // Validate listingId for listing-specific purchases
        const requiresListing: readonly PurchaseType[] = [
            PURCHASE_TYPES.CROSS_LIST,
            PURCHASE_TYPES.AGGRESSIVE_BOOST,
            PURCHASE_TYPES.SPOTLIGHT_3,
            PURCHASE_TYPES.SPOTLIGHT_7,
        ];

        if (requiresListing.includes(dto.type) && !dto.listingId) {
            throw new BadRequestException('listingId is required for this purchase type');
        }

        return this.paymentsService.initializeTransaction(
            user.id,
            user.email,
            dto.type,
            dto.listingId,
            dto.currency || 'NGN',
        );
    }

    @Post('verify')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Verify a payment transaction' })
    async verifyPayment(@Body('reference') reference: string) {
        if (!reference) {
            throw new BadRequestException('Reference is required');
        }

        const result = await this.paymentsService.verifyAndProcessTransaction(reference);
        return result;
    }

    @Post('webhook')
    @ApiOperation({ summary: 'Handle Paystack webhooks' })
    async handleWebhook(
        @Headers('x-paystack-signature') signature: string,
        @Body() body: any,
    ) {
        // Verify webhook signature
        const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
        const hash = crypto
            .createHmac('sha512', secretKey)
            .update(JSON.stringify(body))
            .digest('hex');

        if (hash !== signature) {
            console.error('Invalid Paystack webhook signature');
            return { status: 'invalid signature' };
        }

        await this.paymentsService.handleWebhook(body);
        return { status: 'ok' };
    }
}
