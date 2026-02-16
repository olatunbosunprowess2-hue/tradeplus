import { Module } from '@nestjs/common';
import { CommunityPostsController } from './community-posts.controller';
import { CommunityPostsService } from './community-posts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MonetizationModule } from '../monetization/monetization.module';

@Module({
    imports: [PrismaModule, NotificationsModule, MonetizationModule],
    controllers: [CommunityPostsController],
    providers: [CommunityPostsService],
    exports: [CommunityPostsService],
})
export class CommunityPostsModule { }
