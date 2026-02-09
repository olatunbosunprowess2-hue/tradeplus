import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { CloudinaryProvider } from './cloudinary/cloudinary.provider';
import { CloudinaryService } from './cloudinary/cloudinary.service';

@Module({
    controllers: [UploadsController],
    providers: [CloudinaryProvider, CloudinaryService],
    exports: [CloudinaryService],
})
export class UploadsModule { }
