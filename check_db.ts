
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.listing.count();
        console.log(`Total listings: ${count}`);

        const listings = await prisma.listing.findMany({ take: 1 });
        if (listings.length > 0) {
            console.log('First listing:', JSON.stringify(listings[0], (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
                , 2));
        } else {
            console.log('No listings found.');
        }
    } catch (e) {
        console.error('Error querying database:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
