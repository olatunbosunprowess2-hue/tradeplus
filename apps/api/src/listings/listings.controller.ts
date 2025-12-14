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

@Controller('listings')
export class ListingsController {
    constructor(private readonly listingsService: ListingsService) { }

    @UseGuards(JwtAuthGuard, VerifiedUserGuard)
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
            console.log('DTO:', JSON.stringify(createListingDto, null, 2));

            if (files.images) {
                const imageUrls = files.images.map((file) => {
                    const filename = file.filename;
                    return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
                });
                createListingDto.imageUrls = imageUrls;
            }

            if (files.video && files.video.length > 0) {
                const videoFile = files.video[0];
                createListingDto.videoUrl = `${req.protocol}://${req.get('host')}/uploads/${videoFile.filename}`;
            }

            return await this.listingsService.create(req.user.id, createListingDto);
            // return { success: true, message: 'Skipped service' };
        } catch (error) {
            console.error('Error in ListingsController.create:', error.message);
            if (error.code) {
                console.error('PRISMA ERROR CODE:', error.code);
                console.error('PRISMA ERROR META:', JSON.stringify(error.meta));
            }
            throw error;
        }
    }

    @Get()
    findAll(@Query() query: ListingQueryDto) {
        return this.listingsService.findAll(query);
    }

    @UseGuards(JwtAuthGuard)
    @Get('my-listings')
    getMyListings(@Request() req) {
        return this.listingsService.findByUser(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.listingsService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(
        @Request() req,
        @Param('id') id: string,
        @Body() updateListingDto: UpdateListingDto,
    ) {
        return this.listingsService.update(id, req.user.id, updateListingDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.listingsService.remove(id, req.user.id);
    }
}
