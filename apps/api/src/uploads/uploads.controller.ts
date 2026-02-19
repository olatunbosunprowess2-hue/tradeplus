import { Controller, Post, Get, Param, Res, UseGuards, UseInterceptors, UploadedFile, Req, BadRequestException, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../common/configs/multer.config';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, RequireRole } from '../common/guards/roles.guard';
import * as express from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
    constructor(private readonly cloudinaryService: CloudinaryService) { }

    /**
     * Serve private files (ID docs, verification selfies) — admin/moderator only
     * GET /api/uploads/private/:filename
     */
    @Get('private/:filename')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RequireRole('moderator') // moderator (60) and above: moderator, admin, super_admin
    @ApiOperation({ summary: 'Serve a private upload file (staff only)' })
    async servePrivateFile(
        @Param('filename') filename: string,
        @Res() res: express.Response,
    ) {
        // Path traversal protection: strip directory separators and resolve safely
        const sanitized = filename.replace(/[\/\\\.\.]/g, '');
        if (!sanitized || sanitized !== filename) {
            throw new BadRequestException('Invalid filename');
        }

        const filePath = join(process.cwd(), 'private-uploads', sanitized);

        if (!existsSync(filePath)) {
            throw new NotFoundException('File not found');
        }

        return res.sendFile(filePath);
    }

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
