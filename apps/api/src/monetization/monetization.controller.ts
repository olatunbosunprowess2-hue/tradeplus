import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MonetizationService } from './monetization.service';
import { PRICING, LIMITS } from './pricing.constants';

@ApiTags('Monetization')
@Controller('monetization')
export class MonetizationController {
    constructor(private monetizationService: MonetizationService) { }

    @Get('status')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user monetization status' })
    async getStatus(@CurrentUser() user: any) {
        const status = await this.monetizationService.getUserMonetizationStatus(user.id);
        return {
            ...status,
            pricing: PRICING,
            limits: LIMITS,
        };
    }

    @Get('chat-limit')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Check chat limit status' })
    async checkChatLimit(@CurrentUser() user: any) {
        return this.monetizationService.checkChatLimit(user.id);
    }

    @Get('listing-limit')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Check listing limit status' })
    async checkListingLimit(@CurrentUser() user: any) {
        return this.monetizationService.checkListingLimit(user.id);
    }

    @Get('pricing')
    @ApiOperation({ summary: 'Get all pricing information (public)' })
    getPricing() {
        return {
            pricing: PRICING,
            limits: LIMITS,
        };
    }

    @Post('use-spotlight-credit/:listingId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Use a premium spotlight credit on a listing' })
    async useSpotlightCredit(
        @CurrentUser() user: any,
        @Param('listingId') listingId: string
    ) {
        return this.monetizationService.useSpotlightCredit(user.id, listingId);
    }
}
