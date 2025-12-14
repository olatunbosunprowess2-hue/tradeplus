import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { PromotedListingsService } from './promoted-listings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, RequireRole } from '../common/guards/roles.guard';

@Controller('promoted-listings')
export class PromotedListingsController {
    constructor(private readonly promotedService: PromotedListingsService) { }

    /**
     * Calculate promotion price
     * Public endpoint for price display
     */
    @Get('price')
    calculatePrice(
        @Query('duration') duration: string,
        @Query('placement') placement: string,
    ) {
        const days = parseInt(duration) as 1 | 3 | 7;
        const priceCents = this.promotedService.calculatePrice(days, placement);
        return {
            durationDays: days,
            placement,
            priceCents,
            priceFormatted: `₦${(priceCents / 100).toLocaleString()}`,
        };
    }

    /**
     * Get promoted listings for frontend display
     */
    @Get('display')
    async getForDisplay(@Query('placement') placement: string = 'homepage') {
        return this.promotedService.getPromotedListingsForPlacement(placement);
    }

    /**
     * Get all active promotions (admin)
     * Accessible by: admin+
     */
    @Get('active')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRole('admin')
    async getActivePromotions() {
        return this.promotedService.getActivePromotions();
    }

    /**
     * Promote a listing (admin)
     * Accessible by: admin+
     */
    @Post('promote')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRole('admin')
    async promoteListing(
        @Body() body: { listingId: string; placement: string; durationDays: number },
        @Request() req,
    ) {
        return this.promotedService.promoteListing(
            {
                listingId: body.listingId,
                placement: body.placement as any,
                durationDays: body.durationDays as 1 | 3 | 7,
            },
            req.user.id,
        );
    }

    /**
     * Cancel a promotion (admin)
     * Accessible by: admin+
     */
    @Post(':id/cancel')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRole('admin')
    async cancelPromotion(@Param('id') id: string, @Request() req) {
        return this.promotedService.cancelPromotion(id, req.user.id);
    }
}
