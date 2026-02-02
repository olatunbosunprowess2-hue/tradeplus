import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, Query, HttpException, HttpStatus } from '@nestjs/common';

import { AppealsService } from './appeals.service';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { ReviewAppealDto } from './dto/review-appeal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('appeals')
export class AppealsController {
    constructor(private readonly appealsService: AppealsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req, @Body() createAppealDto: CreateAppealDto) {
        return this.appealsService.create(req.user.id, createAppealDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(
        @Request() req,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        // Use userRole level if available, fallback to legacy role
        const roleLevel = req.user.userRole?.level || (req.user.role === 'admin' ? 80 : 0);
        const isAdmin = roleLevel >= 50; // Moderator and above
        return this.appealsService.findAll(req.user.id, isAdmin, page ? Number(page) : 1, limit ? Number(limit) : 20);
    }


    @UseGuards(JwtAuthGuard)
    @Patch(':id/review')
    reviewAppeal(
        @Request() req,
        @Param('id') appealId: string,
        @Body() reviewDto: ReviewAppealDto
    ) {
        const roleLevel = req.user.userRole?.level || (req.user.role === 'admin' ? 80 : 0);
        if (roleLevel < 50) {
            throw new HttpException('Unauthorized: Staff access required', HttpStatus.UNAUTHORIZED);
        }
        return this.appealsService.reviewAppeal(appealId, req.user.id, reviewDto);
    }

}
