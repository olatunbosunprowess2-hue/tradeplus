import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EscrowService } from './escrow.service';
import { InitiateEscrowDto } from './dto/initiate-escrow.dto';
import { ConfirmEscrowDto } from './dto/confirm-escrow.dto';

@Controller('escrow')
@UseGuards(JwtAuthGuard)
export class EscrowController {
    constructor(private readonly escrowService: EscrowService) { }

    /**
     * Calculate fees for a listing (preview before purchase)
     */
    @Get('fees/:listingId')
    async calculateFees(@Param('listingId') listingId: string) {
        // This is a simplified version - in production, fetch listing price
        // For now, just return a placeholder
        return {
            message: 'Use POST /escrow/initiate to see actual fees',
        };
    }

    /**
     * Initiate escrow purchase for a distress sale listing
     */
    @Post('initiate')
    async initiateEscrow(@Request() req, @Body() dto: InitiateEscrowDto) {
        return this.escrowService.initiateEscrow(req.user.userId, dto);
    }

    /**
     * Buyer confirms receipt with 6-digit code - releases funds to seller
     */
    @Post('confirm')
    async confirmReceipt(@Request() req, @Body() dto: ConfirmEscrowDto) {
        return this.escrowService.confirmReceipt(req.user.userId, dto);
    }

    /**
     * Get escrow status for an order
     */
    @Get('order/:orderId')
    async getEscrowStatus(@Param('orderId') orderId: string) {
        return this.escrowService.getEscrowByOrderId(orderId);
    }

    /**
     * Preview fees for a listing price (public endpoint for UI)
     */
    @Get('preview/:priceCents')
    async previewFees(@Param('priceCents') priceCents: string) {
        const price = BigInt(priceCents);
        const fees = this.escrowService.calculateFees(price);

        return {
            itemPrice: Number(fees.itemPriceCents) / 100,
            protectionFee: Number(fees.protectionFeeCents) / 100,
            protectionFeePercent: fees.protectionFeePercent,
            commission: Number(fees.commissionCents) / 100,
            commissionPercent: fees.commissionPercent,
            totalToPay: Number(fees.totalPaidCents) / 100,
            sellerReceives: Number(fees.sellerReceivesCents) / 100,
        };
    }
}
