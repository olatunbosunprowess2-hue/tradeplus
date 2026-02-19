import { Module, NestModule, MiddlewareConsumer, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import * as Joi from 'joi';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
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
import { UploadsModule } from './uploads/uploads.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

import { RolesModule } from './roles/roles.module';
import { AuditModule } from './audit/audit.module';
import { ActivityModule } from './activity/activity.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SecurityModule } from './security/security.module';
import { EscrowModule } from './escrow/escrow.module';
import { EmailModule } from './email/email.module';
import { HealthModule } from './health/health.module';
import { DisputesModule } from './disputes/disputes.module';
import { CategoriesModule } from './categories/categories.module';
import { MonetizationModule } from './monetization/monetization.module';
import { PaymentsModule } from './payments/payments.module';
import { BrandVerificationModule } from './brand-verification/brand-verification.module';
import { CommunityPostsModule } from './community-posts/community-posts.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            // Joi validation schema for environment variables
            // App will NOT start if required variables are missing
            validationSchema: Joi.object({
                // Required variables - app will fail to start without these
                DATABASE_URL: Joi.string().required().description('PostgreSQL connection URL'),
                JWT_SECRET: Joi.string().required().description('Secret key for JWT signing'),

                // Optional with defaults
                PORT: Joi.number().default(3333).description('Server port'),
                NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
                FRONTEND_URL: Joi.string().default('http://localhost:3000'),

                // JWT configuration
                JWT_EXPIRES_IN: Joi.string().default('15m'),
                JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
                JWT_REFRESH_SECRET: Joi.string().optional(),

                // Optional services
                SENTRY_DSN: Joi.string().optional(),
                SMTP_HOST: Joi.string().optional(),
                SMTP_PORT: Joi.number().optional(),
                SMTP_USER: Joi.string().optional(),
                SMTP_PASS: Joi.string().optional(),
                ADMIN_EMAIL: Joi.string().optional().description('Admin email for brand application alerts'),

                // Cloudinary Configuration
                CLOUDINARY_CLOUD_NAME: Joi.string().required().description('Cloudinary Cloud Name'),
                CLOUDINARY_API_KEY: Joi.string().required().description('Cloudinary API Key'),
                CLOUDINARY_API_SECRET: Joi.string().required().description('Cloudinary API Secret'),
            }),
            validationOptions: {
                abortEarly: false, // Show all validation errors at once
                allowUnknown: true, // Allow extra env vars
            },
        }),
        ThrottlerModule.forRoot([{
            ttl: 60000, // 60 seconds
            limit: 100, // 100 requests per ttl
        }]),
        ScheduleModule.forRoot(),
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
        }),
        // Private uploads are now served through an authenticated endpoint:
        // GET /api/uploads/private/:filename (requires moderator+ role)
        // See uploads.controller.ts servePrivateFile()
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
        UploadsModule,
        RolesModule,
        AuditModule,
        ActivityModule,
        AnalyticsModule,
        SecurityModule,
        EscrowModule,
        EmailModule,
        HealthModule,
        DisputesModule,
        CategoriesModule,
        MonetizationModule,
        PaymentsModule,
        BrandVerificationModule,
        CommunityPostsModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: SentryInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: TimeoutInterceptor,
        },
    ],
})
export class AppModule implements NestModule {
    // Trigger rebuild for new UploadsModule
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('(.*)');
    }
}
