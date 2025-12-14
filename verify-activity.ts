
import { NestFactory } from '@nestjs/core';
import { AppModule } from './apps/api/src/app.module';
import { ActivityService } from './apps/api/src/activity/activity.service';
import { PrismaService } from './apps/api/src/prisma/prisma.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const activityService = app.get(ActivityService);
    const prisma = app.get(PrismaService);

    console.log('Checking listings in DB...');
    const listingsCount = await prisma.listing.count();
    console.log(`Total listings: ${listingsCount}`);

    if (listingsCount > 0) {
        const firstListing = await prisma.listing.findFirst();
        console.log('First listing created at:', firstListing?.createdAt);
        console.log('Current time:', new Date());
        console.log('Diff:', new Date().getTime() - new Date(firstListing?.createdAt!).getTime());
    }

    console.log('\nFetching Top Active Users (24h)...');
    const topUsers24 = await activityService.getTopActiveUsers(24);
    console.log('Top Users Result:', JSON.stringify(topUsers24, null, 2));

    console.log('\nFetching Top Active Users (720h / 30 days)...');
    const topUsers30d = await activityService.getTopActiveUsers(720);
    console.log('Top Users 30d Result:', JSON.stringify(topUsers30d, null, 2));

    await app.close();
}

bootstrap();
