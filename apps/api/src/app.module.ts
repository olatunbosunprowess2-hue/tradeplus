import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ListingsModule } from './listings/listings.module';
import { BarterModule } from './barter/barter.module';
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';
import { CountriesModule } from './countries/countries.module';
import { WantsModule } from './wants/wants.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ReportsModule } from './reports/reports.module';
import { AppealsModule } from './appeals/appeals.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

import { RolesModule } from './roles/roles.module';
import { AuditModule } from './audit/audit.module';
import { ActivityModule } from './activity/activity.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SecurityModule } from './security/security.module';
import { EscrowModule } from './escrow/escrow.module';
import { EmailModule } from './email/email.module';
import { HealthModule } from './health/health.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ThrottlerModule.forRoot([{
            ttl: 60000, // 60 seconds
            limit: 100, // 100 requests per ttl
        }]),
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
        }),
        PrismaModule,
        AuthModule,
        UsersModule,
        ListingsModule,
        BarterModule,
        OrdersModule,
        AdminModule,
        CountriesModule,
        WantsModule,
        MessagesModule,
        NotificationsModule,
        ReviewsModule,
        ReportsModule,
        AppealsModule,
        RolesModule,
        AuditModule,
        ActivityModule,
        AnalyticsModule,
        SecurityModule,
        EscrowModule,
        EmailModule,
        HealthModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('(.*)');
    }
}
