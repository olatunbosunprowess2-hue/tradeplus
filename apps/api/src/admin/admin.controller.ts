import {
    Controller,
    Get,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AdminListingQueryDto } from './dto/admin-listing-query.dto';
import { UpdateListingStatusDto } from './dto/update-listing-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('users')
    getUsers(@Query() query: AdminUserQueryDto) {
        return this.adminService.getUsers(query);
    }

    @Patch('users/:id/status')
    updateUserStatus(
        @Param('id') id: string,
        @Body() updateUserStatusDto: UpdateUserStatusDto,
    ) {
        return this.adminService.updateUserStatus(id, updateUserStatusDto, updateUserStatusDto.adminMessage);
    }

    @Get('listings')
    getListings(@Query() query: AdminListingQueryDto) {
        return this.adminService.getListings(query);
    }

    @Patch('listings/:id/status')
    updateListingStatus(
        @Param('id') id: string,
        @Body() updateListingStatusDto: UpdateListingStatusDto,
    ) {
        return this.adminService.updateListingStatus(id, updateListingStatusDto);
    }

    @Get('reports')
    getReports() {
        return this.adminService.getReports();
    }

    @Get('stats')
    getStats() {
        return this.adminService.getStats();
    }
}
