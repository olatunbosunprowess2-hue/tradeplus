import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { BarterService } from './barter.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { CounterOfferDto } from './dto/counter-offer.dto';
import { OfferQueryDto } from './dto/offer-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { UpdateBrandSettingsDto } from './dto/update-brand-settings.dto';

import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';

@Controller('barter')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class BarterController {
    constructor(private readonly barterService: BarterService) { }

    @UseGuards(VerifiedUserGuard)
    @Post('offers')
    createOffer(@Request() req, @Body() createOfferDto: CreateOfferDto) {
        return this.barterService.createOffer(req.user.id, createOfferDto);
    }

    @Get('offers')
    getOffers(@Request() req, @Query() query: OfferQueryDto) {
        return this.barterService.getOffers(req.user.id, query);
    }

    @Get('offers/:id')
    getOffer(@Request() req, @Param('id') id: string) {
        return this.barterService.getOffer(id, req.user.id);
    }

    @UseGuards(VerifiedUserGuard)
    @Patch('offers/:id/accept')
    acceptOffer(@Request() req, @Param('id') id: string) {
        return this.barterService.acceptOffer(id, req.user.id);
    }

    @Patch('offers/:id/reject')
    rejectOffer(@Request() req, @Param('id') id: string) {
        return this.barterService.rejectOffer(id, req.user.id);
    }

    @UseGuards(VerifiedUserGuard)
    @Post('offers/:id/counter')
    counterOffer(
        @Request() req,
        @Param('id') id: string,
        @Body() counterOfferDto: CounterOfferDto,
    ) {
        return this.barterService.counterOffer(id, req.user.id, counterOfferDto);
    }

    @UseGuards(VerifiedUserGuard)
    @Post('offers/:id/confirm')
    confirmTrade(@Request() req, @Param('id') id: string) {
        return this.barterService.confirmTrade(id, req.user.id);
    }

    @UseGuards(VerifiedUserGuard)
    @Patch('offers/:id/mark-paid')
    markDownpaymentPaid(@Request() req, @Param('id') id: string) {
        return this.barterService.markDownpaymentPaid(id, req.user.id);
    }

    @UseGuards(VerifiedUserGuard)
    @Patch('offers/:id/confirm-receipt')
    confirmDownpaymentReceipt(@Request() req, @Param('id') id: string) {
        return this.barterService.confirmDownpaymentReceipt(id, req.user.id);
    }

    @UseGuards(VerifiedUserGuard)
    @Post('offers/:id/receipt')
    getReceipt(@Request() req, @Param('id') id: string) {
        return this.barterService.getReceipt(id, req.user.id);
    }

    @Get('brand-settings')
    getBrandSettings(@Request() req) {
        return this.barterService.getBrandSettings(req.user.id);
    }

    @Patch('brand-settings')
    updateBrandSettings(@Request() req, @Body() dto: UpdateBrandSettingsDto) {
        return this.barterService.updateBrandSettings(req.user.id, dto);
    }

    @Patch('offers/:id/extend')
    extendTradeTimer(@Request() req, @Param('id') id: string) {
        return this.barterService.extendTradeTimer(id, req.user.id);
    }

    // --- PHASE 4 & 5 ARCHITECTURE ---

    @UseGuards(VerifiedUserGuard)
    @Post('offers/:id/lock')
    lockDeal(@Request() req, @Param('id') id: string) {
        return this.barterService.lockDeal(id, req.user.id);
    }

    @UseGuards(VerifiedUserGuard)
    @Post('offers/:id/verify-pickup')
    verifyPickup(
        @Request() req,
        @Param('id') id: string,
        @Body('pin') pin?: string,
    ) {
        return this.barterService.verifyPickup(id, req.user.id, pin);
    }

    @UseGuards(VerifiedUserGuard)
    @Post('offers/:id/dispute')
    raiseDispute(
        @Request() req,
        @Param('id') id: string,
        @Body('reason') reason: string,
    ) {
        return this.barterService.raiseDispute(id, req.user.id, reason);
    }
}
