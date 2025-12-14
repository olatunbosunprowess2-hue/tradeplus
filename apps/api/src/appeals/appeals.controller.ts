import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
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
    findAll(@Request() req) {
        const isAdmin = req.user.role === 'admin';
        return this.appealsService.findAll(req.user.id, isAdmin);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/review')
    reviewAppeal(
        @Request() req,
        @Param('id') appealId: string,
        @Body() reviewDto: ReviewAppealDto
    ) {
        if (req.user.role !== 'admin') {
            throw new HttpException('Unauthorized: Admin access required', HttpStatus.UNAUTHORIZED);
        }
        return this.appealsService.reviewAppeal(appealId, req.user.id, reviewDto);
    }
}
