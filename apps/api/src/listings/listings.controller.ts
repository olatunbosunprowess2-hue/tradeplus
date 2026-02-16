import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../common/configs/multer.config';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingQueryDto } from './dto/listing-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';

import { CloudinaryService } from '../uploads/cloudinary/cloudinary.service';

@Controller('listings')
export class ListingsController {
    constructor(
        private readonly listingsService: ListingsService,
        private readonly cloudinaryService: CloudinaryService
    ) { }

    @UseGuards(JwtAuthGuard, EmailVerifiedGuard, VerifiedUserGuard)
    @Post()
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'images', maxCount: 10 },
        { name: 'video', maxCount: 1 }
    ], multerConfig))
    async create(
        @Request() req,
        @Body() createListingDto: CreateListingDto,
        @UploadedFiles() files: { images?: Express.Multer.File[], video?: Express.Multer.File[] },
    ) {
        try {
            console.log('Creating listing for user:', req.user.id);
            // console.log('DTO:', JSON.stringify(createListingDto, null, 2));

            if (files.images && files.images.length > 0) {
                const uploadPromises = files.images.map(file => this.cloudinaryService.uploadImage(file));
                const uploadResults = await Promise.all(uploadPromises);
                createListingDto.imageUrls = uploadResults.map(res => res.url);
            }

            if (files.video && files.video.length > 0) {
                const uploadResult = await this.cloudinaryService.uploadImage(files.video[0]);
                createListingDto.videoUrl = uploadResult.url;
            }

            return await this.listingsService.create(req.user.id, createListingDto);
        } catch (error) {
            console.error('Error in ListingsController.create:', error.message);
            throw error;
        }
    }

    @Get()
    findAll(@Query() query: ListingQueryDto) {
        return this.listingsService.findAll(query);
    }

    @UseGuards(JwtAuthGuard)
    @Get('my-listings')
    getMyListings(
        @Request() req,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.listingsService.findByUser(req.user.id, page, limit);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.listingsService.findOne(id);
    }

    @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
    @Patch(':id')
    update(
        @Request() req,
        @Param('id') id: string,
        @Body() updateListingDto: UpdateListingDto,
    ) {
        return this.listingsService.update(id, req.user.id, updateListingDto);
    }

    @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.listingsService.remove(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/view')
    async recordView(@Request() req, @Param('id') id: string) {
        await this.listingsService.recordView(id, req.user.id);
        return { success: true };
    }
}
