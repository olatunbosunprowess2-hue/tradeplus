
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log('No users found. Please register a user first.');
            return;
        }

        console.log(`Seeding listings for user: ${user.email} (${user.id})`);

        // Check if profile exists
        let profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
        if (!profile) {
            const country = await prisma.country.findFirst() || await prisma.country.create({ data: { name: 'Nigeria', code: 'NG', currencyCode: 'NGN', currencySymbol: '₦' } });
            const region = await prisma.region.findFirst({ where: { countryId: country.id } }) || await prisma.region.create({ data: { name: 'Lagos', countryId: country.id } });

            profile = await prisma.userProfile.create({
                data: {
                    userId: user.id,
                    displayName: 'Test User',
                    countryId: country.id,
                    regionId: region.id,
                }
            });
        }

        const category = await prisma.category.findFirst() || await prisma.category.create({ data: { name: 'Electronics', slug: 'electronics' } });

        const listing1 = {
            title: 'iPhone 13 Pro Max',
            description: 'Brand new, sealed in box. 256GB Graphite.',
            priceCents: BigInt(120000),
            currencyCode: 'USD',
            condition: 'new',
            type: 'PHYSICAL',
            status: 'active',
            sellerId: user.id,
            categoryId: category.id,
            countryId: profile.countryId,
            regionId: profile.regionId,
            allowCash: true,
            allowBarter: true,
            allowCashPlusBarter: false,
            quantity: 1,
            shippingMeetInPerson: true,
            shippingShipItem: true,
        };

        await prisma.listing.create({ data: listing1 });
        console.log('Created listing 1');

        const listing2 = {
            title: 'MacBook Pro M1',
            description: 'Used for 6 months, excellent condition. 16GB RAM, 512GB SSD.',
            priceCents: BigInt(150000),
            currencyCode: 'USD',
            condition: 'used',
            type: 'PHYSICAL',
            status: 'active',
            sellerId: user.id,
            categoryId: category.id,
            countryId: profile.countryId,
            regionId: profile.regionId,
            allowCash: true,
            allowBarter: false,
            allowCashPlusBarter: false,
            quantity: 1,
            shippingMeetInPerson: true,
            shippingShipItem: false,
        };

        await prisma.listing.create({ data: listing2 });
        console.log('Created listing 2');

        console.log('Seeding complete.');
    } catch (e) {
        console.error('Error seeding database:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
