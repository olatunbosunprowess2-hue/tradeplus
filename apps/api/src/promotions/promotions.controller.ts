import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('promotions')
export class PromotionsController {
    constructor(private promotionsService: PromotionsService) { }

    /**
     * Get pricing for all promotion types
     * GET /api/promotions/pricing
     */
    @Get('pricing')
    getPricing() {
        return this.promotionsService.getPricing();
    }

    /**
     * Get all promoted listings (public)
     * GET /api/promotions/listings?placement=homepage
     */
    @Get('listings')
    getPromotedListings(@Query('placement') placement?: string) {
        return this.promotionsService.getPromotedListings(placement);
    }

    /**
     * Create a new promotion (requires auth)
     * POST /api/promotions
     */
    @Post()
    @UseGuards(JwtAuthGuard)
    createPromotion(@Request() req, @Body() dto: CreatePromotionDto) {
        return this.promotionsService.createPromotion(req.user.sub, dto);
    }

    /**
     * Get current user's promotions
     * GET /api/promotions/my
     */
    @Get('my')
    @UseGuards(JwtAuthGuard)
    getMyPromotions(@Request() req) {
        return this.promotionsService.getUserPromotions(req.user.sub);
    }

    /**
     * Cancel a promotion
     * DELETE /api/promotions/:id
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    cancelPromotion(@Request() req, @Param('id') id: string) {
        const isAdmin = req.user.role === 'admin';
        return this.promotionsService.cancelPromotion(id, req.user.sub, isAdmin);
    }
}
