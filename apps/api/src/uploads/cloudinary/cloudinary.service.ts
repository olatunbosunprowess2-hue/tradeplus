import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);

    constructor(private configService: ConfigService) { }

    async uploadImage(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
        return new Promise((resolve, reject) => {
            // If file has a path (diskStorage), upload from path
            if (file.path) {
                // Determine folder based on environment
                const nodeEnv = this.configService.get('NODE_ENV');
                const folder = nodeEnv === 'production' ? 'barterwave_prod' : 'barterwave_dev';

                cloudinary.uploader.upload(
                    file.path,
                    {
                        folder,
                        use_filename: true,
                        unique_filename: true,
                    },
                    (error, result) => {
                        // Always clean up local file
                        fs.unlink(file.path, (unlinkError) => {
                            if (unlinkError) {
                                this.logger.error(`Failed to delete temp file: ${file.path}`, unlinkError);
                            }
                        });

                        if (error || !result) return reject(error || new Error('Upload result is undefined'));
                        resolve({
                            url: result.secure_url,
                            publicId: result.public_id,
                        });
                    },
                );
            } else {
                reject(new Error('File path not found. Ensure Multer is using DiskStorage.'));
            }
        });
    }
}
