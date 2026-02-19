import { Controller, Get, Body, Patch, UseGuards, Request, UseInterceptors, UploadedFiles, Query, Param } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { multerConfig } from '../common/configs/multer.config';
import { CloudinaryService } from '../uploads/cloudinary/cloudinary.service';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly cloudinaryService: CloudinaryService,
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
        { name: 'idDocumentFront', maxCount: 1 },
        { name: 'idDocumentBack', maxCount: 1 },
    ], multerConfig))
    async updateProfile(
        @Request() req,
        @Body() dto: UpdateProfileDto,
        @UploadedFiles() files: {
            avatar?: Express.Multer.File[],
            faceVerification?: Express.Multer.File[],
            idDocumentFront?: Express.Multer.File[],
            idDocumentBack?: Express.Multer.File[]
        }
    ) {
        try {
            console.log('📥 Received profile update request for user:', req.user.id);
            console.log('📋 DTO fields:', Object.keys(dto));
            console.log('📎 Files received:', {
                avatar: files?.avatar?.length || 0,
                faceVerification: files?.faceVerification?.length || 0,
                idDocumentFront: files?.idDocumentFront?.length || 0,
                idDocumentBack: files?.idDocumentBack?.length || 0,
            });

            // Map uploaded files to DTO fields
            if (files?.avatar?.[0]) {
                try {
                    const result = await this.cloudinaryService.uploadImage(files.avatar[0]);
                    dto.avatarUrl = result.url;
                    console.log('✅ Avatar uploaded to Cloudinary:', dto.avatarUrl);
                } catch (uploadError) {
                    console.error('❌ Failed to upload avatar to Cloudinary:', uploadError);
                    throw uploadError;
                }
            }
            if (files?.faceVerification?.[0]) {
                dto.faceVerificationUrl = `/private-uploads/${files.faceVerification[0].filename}`;
                console.log('✅ Face verification saved:', dto.faceVerificationUrl);
            }
            if (files?.idDocumentFront?.[0]) {
                dto.idDocumentFrontUrl = `/private-uploads/${files.idDocumentFront[0].filename}`;
                console.log('✅ ID Front saved:', dto.idDocumentFrontUrl);
            }
            if (files?.idDocumentBack?.[0]) {
                dto.idDocumentBackUrl = `/private-uploads/${files.idDocumentBack[0].filename}`;
                console.log('✅ ID Back saved:', dto.idDocumentBackUrl);
            }

            // Handle numeric conversion for coordinates if sent as strings (multipart/form-data sends everything as strings)
            if (typeof dto.locationLat === 'string') dto.locationLat = parseFloat(dto.locationLat);
            if (typeof dto.locationLng === 'string') dto.locationLng = parseFloat(dto.locationLng);
            if (typeof dto.regionId === 'string') dto.regionId = parseInt(dto.regionId);
            if (typeof dto.countryId === 'string') dto.countryId = parseInt(dto.countryId);

            // Handle boolean conversion
            if (typeof dto.onboardingCompleted === 'string') {
                dto.onboardingCompleted = dto.onboardingCompleted === 'true';
                console.log('✅ Onboarding completed set to:', dto.onboardingCompleted);
            }

            console.log('💾 Saving to database...');
            const result = await this.usersService.updateProfile(req.user.id, dto);
            console.log('✅ Profile updated successfully');
            return result;
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            console.error('Error stack:', error.stack);
            throw error;
        }
    }
}
