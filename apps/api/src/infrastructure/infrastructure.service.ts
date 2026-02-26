import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Resend } from 'resend';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

@Injectable()
export class InfrastructureService {
    private readonly logger = new Logger(InfrastructureService.name);
    private s3Client: S3Client;
    private resend: Resend;
    private r2CustomDomain: string;
    private r2BucketName: string;

    constructor(private configService: ConfigService) {
        // Initialize R2 (S3 Client)
        const accountId = this.configService.get<string>('CLOUDFLARE_ACCOUNT_ID');
        const accessKeyId = this.configService.get<string>('CLOUDFLARE_R2_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
        const endpoint = this.configService.get<string>('CLOUDFLARE_R2_ENDPOINT');

        this.r2BucketName = this.configService.get<string>('CLOUDFLARE_R2_BUCKET_NAME') || 'barterwave-media';
        this.r2CustomDomain = this.configService.get<string>('CLOUDFLARE_R2_CUSTOM_DOMAIN') || 'https://images.barterwave.com';

        if (accessKeyId && secretAccessKey && endpoint) {
            this.s3Client = new S3Client({
                region: 'auto',
                endpoint: endpoint,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
            });
            this.logger.log('✅ Cloudflare R2 Client initialized');
        } else {
            this.logger.warn('⚠️ Cloudflare R2 configuration missing');
        }

        // Initialize Resend
        const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
        if (resendApiKey) {
            this.resend = new Resend(resendApiKey);
            this.logger.log('✅ Resend Client initialized');
        } else {
            this.logger.warn('⚠️ Resend configuration missing');
        }
    }

    /**
     * Uploads an image explicitly to R2.
     */
    async uploadImage(file: Express.Multer.File): Promise<{ url: string }> {
        return this.uploadFile(file, 'image');
    }

    /**
     * Internal method to handle file uploads to R2
     */
    private async uploadFile(file: Express.Multer.File, type: 'image' | 'video'): Promise<{ url: string }> {
        if (!this.s3Client) {
            this.cleanupTempFile(file.path);
            throw new Error('R2 Client not configured');
        }

        // Check for file size explicitly
        // Reject videos > 50MB (50 * 1024 * 1024 bytes)
        const isVideo = file.mimetype.startsWith('video/');
        const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

        if (isVideo && file.size > MAX_VIDEO_SIZE) {
            this.cleanupTempFile(file.path);
            throw new BadRequestException('Video size must not exceed 50MB');
        }

        const nodeEnv = this.configService.get('NODE_ENV');
        const folder = nodeEnv === 'production' ? 'prod' : 'dev';
        const fileExt = path.extname(file.originalname);
        const uniqueFileName = `${crypto.randomUUID()}${fileExt}`;
        const key = `${folder}/${uniqueFileName}`;

        try {
            const fileStream = fs.createReadStream(file.path);

            await this.s3Client.send(new PutObjectCommand({
                Bucket: this.r2BucketName,
                Key: key,
                Body: fileStream,
                ContentType: file.mimetype,
            }));

            const url = `${this.r2CustomDomain}/${key}`;
            return { url };
        } catch (error) {
            this.logger.error(`Failed to upload file to R2: ${error.message}`, error.stack);
            throw error;
        } finally {
            this.cleanupTempFile(file.path);
        }
    }

    /**
     * Sends an email using Resend
     */
    async sendEmail(options: EmailOptions): Promise<boolean> {
        if (!this.resend) {
            this.logger.warn(`❌ Email not sent (Resend not configured): ${options.subject} to ${options.to}`);
            return false;
        }

        const fromEmail = this.configService.get<string>('EMAIL_FROM') || 'system@barterwave.com';
        const fromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'BarterWave';

        try {
            const response = await this.resend.emails.send({
                from: `${fromName} <${fromEmail}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text || '',
            });

            if (response.error) {
                this.logger.error(`❌ Failed to send email via Resend: ${response.error.message}`);
                return false;
            }

            this.logger.log(`✅ Email sent via Resend: ${options.subject} to ${options.to}`);
            return true;
        } catch (error: any) {
            this.logger.error(`❌ Error sending email via Resend: ${error.message}`, error.stack);
            return false;
        }
    }

    private cleanupTempFile(filePath: string) {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) this.logger.error(`Failed to cleanup file ${filePath}: ${err.message}`);
            });
        }
    }
}
