import { Controller, Post, Get, Body, UseGuards, Request, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, RequireRole } from '../common/guards/roles.guard';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req, @Body() createReportDto: CreateReportDto) {
        return this.reportsService.create(req.user.id, createReportDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRole('moderator')
    @Get()
    findAll(@Request() req) {
        return this.reportsService.findAll();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRole('moderator')
    @Patch(':id/resolve')
    async resolveReport(
        @Request() req,
        @Param('id') reportId: string,
        @Body() resolveReportDto: ResolveReportDto
    ) {
        return this.reportsService.resolveReport(reportId, resolveReportDto.adminMessage);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRole('moderator')
    @Delete(':id/delete-listing')
    async deleteReportedListing(
        @Request() req,
        @Param('id') reportId: string,
        @Body() resolveReportDto: ResolveReportDto
    ) {
        return this.reportsService.deleteReportedListing(reportId, resolveReportDto.adminMessage);
    }
}

