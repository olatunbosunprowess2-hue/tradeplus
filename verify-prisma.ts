
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting...');

    const count = await prisma.listing.count();
    console.log(`Total listings: ${count}`);

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log('Now:', now.toISOString());
    console.log('24h ago:', yesterday.toISOString());

    const recentListings = await prisma.listing.findMany({
        where: { createdAt: { gte: yesterday } },
        select: { id: true, createdAt: true, sellerId: true }
    });

    console.log(`Listings in last 24h: ${recentListings.length}`);
    if (recentListings.length > 0) {
        console.log('Sample listing time:', recentListings[0].createdAt.toISOString());
    } else {
        const anyListing = await prisma.listing.findFirst();
        if (anyListing) {
            console.log('Oldest listing time:', anyListing.createdAt.toISOString());
        }
    }

    console.log('\nTesting GroupBy...');
    const topSellers = await prisma.listing.groupBy({
        by: ['sellerId'],
        where: { createdAt: { gte: yesterday } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20
    });

    console.log('Top Sellers GroupBy Result:', JSON.stringify(topSellers, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
