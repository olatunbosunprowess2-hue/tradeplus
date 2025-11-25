import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Request() req, @Body() createReviewDto: CreateReviewDto) {
        return this.reviewsService.create(req.user.userId, createReviewDto);
    }

    @Get()
    findAll(@Query() query: ReviewQueryDto) {
        return this.reviewsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.reviewsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(
        @Param('id') id: string,
        @Request() req,
        @Body() updateReviewDto: UpdateReviewDto,
    ) {
        return this.reviewsService.update(id, req.user.userId, updateReviewDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string, @Request() req) {
        return this.reviewsService.remove(id, req.user.userId);
    }

    @Post(':id/flag')
    @UseGuards(JwtAuthGuard)
    flag(@Param('id') id: string, @Request() req) {
        return this.reviewsService.flag(id, req.user.userId);
    }

    @Get('admin/flagged')
    @UseGuards(JwtAuthGuard, AdminGuard)
    getFlaggedReviews() {
        return this.reviewsService.getFlaggedReviews();
    }

    @Patch('admin/:id/moderate')
    @UseGuards(JwtAuthGuard, AdminGuard)
    moderate(
        @Param('id') id: string,
        @Body() moderateReviewDto: ModerateReviewDto,
    ) {
        return this.reviewsService.moderate(id, moderateReviewDto);
    }
}
