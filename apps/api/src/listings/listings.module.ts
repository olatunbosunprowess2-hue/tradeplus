import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { PromotedListingsService } from './promoted-listings.service';
import { PromotedListingsController } from './promoted-listings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [PrismaModule, AuditModule],
    controllers: [ListingsController, PromotedListingsController],
    providers: [ListingsService, PromotedListingsService],
    exports: [ListingsService, PromotedListingsService],
})
export class ListingsModule { }

