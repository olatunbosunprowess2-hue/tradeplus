import { Controller, Post, UseInterceptors, UploadedFile, Req, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../common/configs/multer.config';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary/cloudinary.service';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
    constructor(private readonly cloudinaryService: CloudinaryService) { }

    @Post('image')
    @ApiOperation({ summary: 'Upload a single image file' })
    @UseInterceptors(FileInterceptor('file', multerConfig))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('File upload failed or no file provided');
        }

        try {
            const result = await this.cloudinaryService.uploadImage(file);
            return { url: result.url };
        } catch (error) {
            console.error('Upload failed:', error);
            throw new BadRequestException('Failed to upload image to cloud storage');
        }
    }
}
