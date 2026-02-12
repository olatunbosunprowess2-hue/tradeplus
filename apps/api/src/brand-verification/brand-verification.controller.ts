import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { BrandVerificationService } from './brand-verification.service';
import { BrandApplyDto, WaitlistDto, BrandRejectDto } from './dto/brand-verification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('brand-verification')
export class BrandVerificationController {
    constructor(private readonly brandVerificationService: BrandVerificationService) { }

    // ========================================================================
    // USER ENDPOINTS (authenticated)
    // ========================================================================

    @Post('apply')
    @UseGuards(JwtAuthGuard)
    async applyForBrand(@Request() req, @Body() dto: BrandApplyDto) {
        return this.brandVerificationService.applyForBrandVerification(req.user.id, dto);
    }

    @Get('status')
    @UseGuards(JwtAuthGuard)
    async getMyStatus(@Request() req) {
        return this.brandVerificationService.getMyBrandStatus(req.user.id);
    }

    // ========================================================================
    // PUBLIC ENDPOINT (no auth)
    // ========================================================================

    @Post('waitlist')
    async joinWaitlist(@Body() dto: WaitlistDto) {
        return this.brandVerificationService.joinWaitlist(dto);
    }

    // ========================================================================
    // ADMIN ENDPOINTS
    // ========================================================================

    @Get('admin/pending')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async getPendingApplications(@Query('page') page?: string, @Query('limit') limit?: string) {
        return this.brandVerificationService.getPendingApplications(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
        );
    }

    @Get('admin/applications')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async getAllApplications(
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.brandVerificationService.getAllBrandApplications(
            status,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
        );
    }

    @Get('admin/waitlist')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async getWaitlist(@Query('page') page?: string, @Query('limit') limit?: string) {
        return this.brandVerificationService.getWaitlist(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 50,
        );
    }

    @Get('admin/pending-count')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async getPendingCount() {
        const count = await this.brandVerificationService.getPendingCount();
        return { count };
    }

    @Patch('admin/:userId/approve')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async approveBrand(@Param('userId') userId: string, @Request() req) {
        return this.brandVerificationService.approveBrand(userId, req.user.id);
    }

    @Patch('admin/:userId/reject')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async rejectBrand(@Param('userId') userId: string, @Request() req, @Body() dto: BrandRejectDto) {
        return this.brandVerificationService.rejectBrand(userId, req.user.id, dto);
    }

    @Patch('admin/:userId/revoke')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async revokeBrand(@Param('userId') userId: string, @Request() req) {
        return this.brandVerificationService.revokeBrand(userId, req.user.id);
    }

    @Patch('admin/:userId/toggle')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async toggleBrandStatus(
        @Param('userId') userId: string,
        @Request() req,
        @Body('verified') verified: boolean,
    ) {
        return this.brandVerificationService.toggleBrandStatus(userId, req.user.id, verified);
    }
}
