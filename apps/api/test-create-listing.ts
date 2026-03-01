import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCreate() {
    console.log('Fetching test user...');
    const user = await prisma.user.findFirst({
        where: { role: 'user', deletedAt: null }
    });

    if (!user) {
        console.log('No user found to test with.');
        process.exit(1);
    }

    console.log(`Testing with user: ${user.id}`);

    // Need to mimic the exact DTO from the create/page.tsx
    const dto = {
        title: 'Test Publish Error Listing',
        description: 'This is a test to reproduce the 500 ISE.',
        type: 'PHYSICAL',
        condition: 'new',
        categoryId: 1, // Assume 1 is valid
        priceCents: 50000000,
        currencyCode: 'NGN',
        allowCash: true,
        allowBarter: false,
        allowCashPlusBarter: false,
        quantity: 2,
        isAvailable: true,
        shippingMeetInPerson: true,
        shippingShipItem: false,
        isDistressSale: false,
        distressReason: '',
        barterPreference1: '',
        barterPreference2: '',
        barterPreference3: '',
        barterPreferencesOnly: false,
        downpaymentCents: '',
        imageUrls: ['https://images.barterwave.com/placeholder.jpg']
    };

    try {
        const { imageUrls, ...listingData } = dto as any;

        const prismaData = {
            ...listingData,
            sellerId: user.id,
            priceCents: dto.priceCents ? BigInt(Math.round(dto.priceCents)) : null,
            downpaymentCents: dto.downpaymentCents ? BigInt(Math.round(dto.downpaymentCents)) : null,
            quantity: dto.type === 'SERVICE' ? 1 : (dto.quantity || 1),
        };

        console.log('Attempting Prisma Create:', prismaData);
        const listing = await prisma.listing.create({
            data: prismaData
        });
        console.log('Success:', listing.id);

    } catch (error) {
        console.error('ERROR REPRODUCED:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

testCreate();
