import { Controller, Get, Body, Patch, Delete, UseGuards, Request, UseInterceptors, UploadedFiles, Query, Param } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { multerConfig } from '../common/configs/multer.config';
import { InfrastructureService } from '../infrastructure/infrastructure.service';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly infrastructureService: InfrastructureService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('admin/all') // Used by Team Page initial load
    async getAdmins(
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.usersService.findAllAdmins(page, limit);
    }


    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(
        @Query('search') search?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.usersService.findAll(search, page, limit);
    }


    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        return this.usersService.findOne(req.user.id);
    }

    @Get(':id')
    getPublicProfile(@Param('id') id: string) {
        return this.usersService.findPublicProfile(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'avatar', maxCount: 1 },
        { name: 'faceVerification', maxCount: 1 },
    ], multerConfig))
    async updateProfile(
        @Request() req,
        @Body() dto: UpdateProfileDto,
        @UploadedFiles() files: {
            avatar?: Express.Multer.File[],
            faceVerification?: Express.Multer.File[],
        }
    ) {
        try {
            // Map uploaded files to DTO fields
            if (files?.avatar?.[0]) {
                const result = await this.infrastructureService.uploadImage(files.avatar[0]);
                dto.avatarUrl = result.url;
            }
            if (files?.faceVerification?.[0]) {
                const result = await this.infrastructureService.uploadImage(files.faceVerification[0]);
                dto.faceVerificationUrl = result.url;
            }

            // Handle numeric conversion for coordinates if sent as strings (multipart/form-data sends everything as strings)
            if (typeof dto.locationLat === 'string') dto.locationLat = parseFloat(dto.locationLat);
            if (typeof dto.locationLng === 'string') dto.locationLng = parseFloat(dto.locationLng);
            if (typeof dto.regionId === 'string') dto.regionId = parseInt(dto.regionId);
            if (typeof dto.countryId === 'string') dto.countryId = parseInt(dto.countryId);

            // Handle boolean conversion
            if (typeof dto.onboardingCompleted === 'string') {
                dto.onboardingCompleted = dto.onboardingCompleted === 'true';
            }

            return await this.usersService.updateProfile(req.user.id, dto);
        } catch (error) {
            console.error('Error updating profile:', error.message);
            throw error;
        }
    }

    @UseGuards(JwtAuthGuard)
    @Delete('account')
    async deleteAccount(@Request() req) {
        return this.usersService.deleteAccount(req.user.id);
    }
}
