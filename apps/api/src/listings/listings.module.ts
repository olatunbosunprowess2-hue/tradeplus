import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { PromotedListingsService } from './promoted-listings.service';
import { PromotedListingsController } from './promoted-listings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityModule } from '../activity/activity.module';
import { AuditModule } from '../audit/audit.module';

import { BarterModule } from '../barter/barter.module';
import { WantsModule } from '../wants/wants.module';


import { NotificationsModule } from '../notifications/notifications.module';
import { SecurityModule } from '../security/security.module';

@Module({
    imports: [
        PrismaModule,
        AuditModule,
        ActivityModule,
        BarterModule,
        WantsModule,
        NotificationsModule,
        SecurityModule
    ],



    controllers: [ListingsController, PromotedListingsController],
    providers: [ListingsService, PromotedListingsService],
    exports: [ListingsService, PromotedListingsService],
})
export class ListingsModule { }

