import { Controller, Post, Get, Body, UseGuards, Request, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req, @Body() createReportDto: CreateReportDto) {
        return this.reportsService.create(req.user.id, createReportDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Request() req) {
        // Only allow admins to view all reports
        if (req.user.role !== 'admin') {
            throw new HttpException('Unauthorized: Admin access required', HttpStatus.UNAUTHORIZED);
        }
        return this.reportsService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/resolve')
    async resolveReport(
        @Request() req,
        @Param('id') reportId: string,
        @Body() resolveReportDto: ResolveReportDto
    ) {
        if (req.user.role !== 'admin') {
            throw new HttpException('Unauthorized: Admin access required', HttpStatus.UNAUTHORIZED);
        }
        return this.reportsService.resolveReport(reportId, resolveReportDto.adminMessage);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/delete-listing')
    async deleteReportedListing(
        @Request() req,
        @Param('id') reportId: string,
        @Body() resolveReportDto: ResolveReportDto
    ) {
        if (req.user.role !== 'admin') {
            throw new HttpException('Unauthorized: Admin access required', HttpStatus.UNAUTHORIZED);
        }
        return this.reportsService.deleteReportedListing(reportId, resolveReportDto.adminMessage);
    }
}
