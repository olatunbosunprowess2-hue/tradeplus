import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
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
            throw new Error('Unauthorized: Admin access required');
        }
        return this.reportsService.findAll();
    }
}
