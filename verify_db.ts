import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for listing with ID: 11111111-1111-1111-1111-111111111111');
    const listing = await prisma.listing.findUnique({
        where: { id: '11111111-1111-1111-1111-111111111111' },
    });

    if (listing) {
        console.log('✅ Listing found:', listing.title);
    } else {
        console.error('❌ Listing NOT found!');
    }

    const count = await prisma.listing.count();
    console.log(`Total listings in DB: ${count}`);

    const allListings = await prisma.listing.findMany({ select: { id: true, title: true } });
    console.log('All Listings:', allListings);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
