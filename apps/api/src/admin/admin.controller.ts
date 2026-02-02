import {
    Controller,
    Get,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';

import { AdminService } from './admin.service';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AdminListingQueryDto } from './dto/admin-listing-query.dto';
import { UpdateListingStatusDto } from './dto/update-listing-status.dto';
import { AdminReportQueryDto } from './dto/admin-report-query.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { RolesGuard, RequireRole } from '../common/guards/roles.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('users')
    getUsers(@Query() query: AdminUserQueryDto) {
        return this.adminService.getUsers(query);
    }

    @Get('users/:id')
    @UseGuards(RolesGuard)
    @RequireRole('moderator')
    getUser(@Param('id') id: string) {
        return this.adminService.getUser(id);
    }

    @Get('users/:id/reports')
    getUserReports(@Param('id') id: string) {
        return this.adminService.getUserReports(id);
    }

    @Patch('users/:id/status')
    updateUserStatus(
        @Param('id') id: string,
        @Body() updateUserStatusDto: UpdateUserStatusDto,
        @Request() req
    ) {
        return this.adminService.updateUserStatus(id, updateUserStatusDto, req.user.id, updateUserStatusDto.adminMessage);
    }


    @Get('listings')
    getListings(@Query() query: AdminListingQueryDto) {
        return this.adminService.getListings(query);
    }

    @Patch('listings/:id/status')
    updateListingStatus(
        @Param('id') id: string,
        @Body() updateListingStatusDto: UpdateListingStatusDto,
        @Request() req
    ) {
        return this.adminService.updateListingStatus(id, updateListingStatusDto, req.user.id);
    }


    @Get('reports')
    getReports(@Query() query: AdminReportQueryDto) {
        return this.adminService.getReports(query);
    }


    @Get('stats')
    getStats() {
        return this.adminService.getStats();
    }

    @Get('sidebar-counts')
    getSidebarCounts() {
        return this.adminService.getSidebarCounts();
    }

    @Get('conversations/:id/messages')
    @UseGuards(RolesGuard)
    @RequireRole('moderator')
    getConversationMessages(@Param('id') id: string) {
        return this.adminService.getConversationMessages(id);
    }

    // =====================
    // MONETIZATION ENDPOINTS
    // =====================

    @Get('monetization/revenue')
    getRevenueStats() {
        return this.adminService.getRevenueStats();
    }

    @Get('monetization/transactions')
    getTransactions(@Query() query: { type?: string; page?: number; limit?: number }) {
        return this.adminService.getTransactions(query);
    }

    @Get('monetization/spotlights')
    getActiveSpotlights() {
        return this.adminService.getActiveSpotlights();
    }

    @Patch('monetization/spotlights/:id/remove')
    removeSpotlight(@Param('id') id: string, @Request() req) {
        return this.adminService.removeSpotlight(id, req.user.id);
    }
}
