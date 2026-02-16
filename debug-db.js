const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const listings = await prisma.listing.findMany({
            take: 5,
            select: {
                id: true,
                title: true,
                status: true,
            }
        });
        console.log(JSON.stringify(listings, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
