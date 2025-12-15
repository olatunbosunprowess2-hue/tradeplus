import { Controller, Post, UseInterceptors, UploadedFile, Req, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../common/configs/multer.config';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
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
    uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req) {
        if (!file) {
            throw new BadRequestException('File upload failed or no file provided');
        }

        // Construct public URL
        const protocol = req.protocol;
        const host = req.get('host');
        const url = `${protocol}://${host}/uploads/${file.filename}`;

        return { url };
    }
}
