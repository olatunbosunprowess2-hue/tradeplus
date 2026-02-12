import { Module } from '@nestjs/common';
import { BrandVerificationController } from './brand-verification.controller';
import { BrandVerificationService } from './brand-verification.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [BrandVerificationController],
    providers: [BrandVerificationService],
    exports: [BrandVerificationService],
})
export class BrandVerificationModule { }
