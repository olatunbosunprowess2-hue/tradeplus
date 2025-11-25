import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Static UUIDs for consistency with frontend mocks
const USERS = {
    JOHN: 'a0000000-0000-0000-0000-000000000001',
    SARAH: 'a0000000-0000-0000-0000-000000000002',
    MIKE: 'a0000000-0000-0000-0000-000000000003',
    FIXIT: 'a0000000-0000-0000-0000-000000000004',
    DEV: 'a0000000-0000-0000-0000-000000000005',
    MUSIC: 'a0000000-0000-0000-0000-000000000006',
    ADMIN: 'a0000000-0000-0000-0000-000000000000',
};

const LISTINGS = {
    IPHONE: '11111111-1111-1111-1111-111111111111',
    TV: '22222222-2222-2222-2222-222222222222',
    MACBOOK: '33333333-3333-3333-3333-333333333333',
    PS5: '44444444-4444-4444-4444-444444444444',
    HANDBAG: '88888888-8888-8888-8888-888888888888',
    PLUMBING: '10101010-1010-1010-1010-101010101010',
    WEBDEV: '10201020-1020-1020-1020-102010201020',
    PIANO: '10301030-1030-1030-1030-103010301030',
};

async function main() {
    console.log('🌱 Seeding database...');

    // Create test users
    const hashedPassword = await argon2.hash('password123');

    const user1 = await prisma.user.upsert({
        where: { id: USERS.JOHN },
        update: {},
        create: {
            id: USERS.JOHN,
            email: 'john@example.com',
            passwordHash: hashedPassword,
            role: 'user',
            profile: {
                create: {
                    displayName: 'John Doe',
                    bio: 'Tech enthusiast and gadget lover',
                },
            },
        },
    });

    const user2 = await prisma.user.upsert({
        where: { id: USERS.SARAH },
        update: {},
        create: {
            id: USERS.SARAH,
            email: 'sarah@example.com',
            passwordHash: hashedPassword,
            role: 'user',
            profile: {
                create: {
                    displayName: 'Sarah Smith',
                    bio: 'Fashion and lifestyle blogger',
                },
            },
        },
    });

    const user3 = await prisma.user.upsert({
        where: { id: USERS.MIKE },
        update: {},
        create: {
            id: USERS.MIKE,
            email: 'mike@example.com',
            passwordHash: hashedPassword,
            role: 'user',
            profile: {
                create: {
                    displayName: 'Mike Johnson',
                    bio: 'Fitness and sports gear collector',
                },
            },
        },
    });

    // Additional service providers
    await prisma.user.upsert({
        where: { id: USERS.FIXIT },
        update: {},
        create: {
            id: USERS.FIXIT,
            email: 'fixit@example.com',
            passwordHash: hashedPassword,
            role: 'user',
            profile: {
                create: {
                    displayName: 'FixIt Pro Services',
                    bio: 'Professional Plumbing Services',
                },
            },
        },
    });

    await prisma.user.upsert({
        where: { id: USERS.DEV },
        update: {},
        create: {
            id: USERS.DEV,
            email: 'dev@example.com',
            passwordHash: hashedPassword,
            role: 'user',
            profile: {
                create: {
                    displayName: 'CodeMaster Devs',
                    bio: 'Full Stack Web Development',
                },
            },
        },
    });

    await prisma.user.upsert({
        where: { id: USERS.MUSIC },
        update: {},
        create: {
            id: USERS.MUSIC,
            email: 'music@example.com',
            passwordHash: hashedPassword,
            role: 'user',
            profile: {
                create: {
                    displayName: 'Melody Music',
                    bio: 'Music Lessons',
                },
            },
        },
    });

    // Create admin user
    const adminUser = await prisma.user.upsert({
        where: { id: USERS.ADMIN },
        update: { role: 'admin' },
        create: {
            id: USERS.ADMIN,
            email: 'admin@tradeplus.com',
            passwordHash: hashedPassword,
            role: 'admin',
            profile: {
                create: {
                    displayName: 'Admin User',
                    bio: 'System Administrator',
                },
            },
        },
    });

    console.log('✅ Users created (including admin)');

    // Create categories
    const electronics = await prisma.category.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, name: 'Electronics', slug: 'electronics' },
    });

    const fashion = await prisma.category.upsert({
        where: { id: 2 },
        update: {},
        create: { id: 2, name: 'Fashion', slug: 'fashion' },
    });

    const mobilePhones = await prisma.category.upsert({
        where: { id: 3 },
        update: {},
        create: { id: 3, name: 'Mobile Phones & Tablets', slug: 'mobile-phones' },
    });

    const home = await prisma.category.upsert({
        where: { id: 4 },
        update: {},
        create: { id: 4, name: 'Home & Garden', slug: 'home-garden' },
    });

    const sports = await prisma.category.upsert({
        where: { id: 5 },
        update: {},
        create: { id: 5, name: 'Sports & Outdoors', slug: 'sports' },
    });

    const beauty = await prisma.category.upsert({
        where: { id: 6 },
        update: {},
        create: { id: 6, name: 'Beauty & Health', slug: 'beauty' },
    });

    const vehicles = await prisma.category.upsert({
        where: { id: 7 },
        update: {},
        create: { id: 7, name: 'Vehicles', slug: 'vehicles' },
    });

    const services = await prisma.category.upsert({
        where: { id: 8 },
        update: {},
        create: { id: 8, name: 'Services', slug: 'services' },
    });

    const books = await prisma.category.upsert({
        where: { id: 9 },
        update: {},
        create: { id: 9, name: 'Books & Media', slug: 'books' },
    });

    const jobs = await prisma.category.upsert({
        where: { id: 10 },
        update: {},
        create: { id: 10, name: 'Jobs', slug: 'jobs' },
    });

    console.log('✅ Categories created');

    // Create listings with various trade options
    const listings = [
        {
            id: LISTINGS.IPHONE,
            title: 'iPhone 13 Pro Max - 256GB',
            description: 'Excellent condition, barely used. Comes with original box and accessories.',
            priceCents: 85000000, // ₦850,000
            condition: 'used',
            quantity: 1,
            allowCash: true,
            allowBarter: false,
            sellerId: USERS.JOHN,
            categoryId: mobilePhones.id,
            imageUrl: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=500&h=500&fit=crop',
        },
        {
            id: LISTINGS.TV,
            title: 'Samsung 55" 4K Smart TV',
            description: 'Brand new, sealed in box. Latest model with HDR and smart features.',
            priceCents: 45000000, // ₦450,000
            condition: 'new',
            quantity: 2,
            allowCash: true,
            allowBarter: true,
            sellerId: USERS.SARAH,
            categoryId: electronics.id,
            imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=500&fit=crop',
        },
        {
            id: LISTINGS.MACBOOK,
            title: 'MacBook Pro M2 - 16GB RAM',
            description: 'Perfect for professionals. 512GB SSD, Space Gray. Open to trades!',
            priceCents: 0, // Barter only
            condition: 'used',
            quantity: 1,
            allowCash: false,
            allowBarter: true,
            sellerId: USERS.JOHN,
            categoryId: electronics.id,
            imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop',
        },
        {
            id: LISTINGS.PS5,
            title: 'PlayStation 5 Console',
            description: 'Brand new PS5 with 2 controllers and 3 games. Cash or trade for iPhone.',
            priceCents: 55000000, // ₦550,000
            condition: 'new',
            quantity: 1,
            allowCash: true,
            allowBarter: true,
            sellerId: USERS.MIKE,
            categoryId: electronics.id,
            imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&h=500&fit=crop',
        },
        {
            id: LISTINGS.HANDBAG,
            title: 'Designer Leather Handbag',
            description: 'Authentic luxury handbag. Willing to trade for electronics or accept cash.',
            priceCents: 12000000, // ₦120,000
            condition: 'used',
            quantity: 1,
            allowCash: true,
            allowBarter: true,
            sellerId: USERS.SARAH,
            categoryId: fashion.id,
            imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=500&fit=crop',
        },
        {
            id: LISTINGS.PLUMBING,
            title: 'Professional Plumbing Services',
            description: 'Expert plumbing services for residential and commercial properties.',
            priceCents: 1500000,
            condition: 'new', // Services are "new"
            quantity: 1,
            allowCash: true,
            allowBarter: true,
            sellerId: USERS.FIXIT,
            categoryId: services.id,
            imageUrl: 'https://images.unsplash.com/photo-1581578731117-104f8a3d46a8?w=500&h=500&fit=crop',
        },
        {
            id: LISTINGS.WEBDEV,
            title: 'Full Stack Web Development',
            description: 'Custom website and web application development using React, Next.js, and Node.js.',
            priceCents: 25000000,
            condition: 'new',
            quantity: 1,
            allowCash: true,
            allowBarter: true,
            sellerId: USERS.DEV,
            categoryId: services.id,
            imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&h=500&fit=crop',
        },
        {
            id: LISTINGS.PIANO,
            title: 'Piano & Music Theory Lessons',
            description: 'Private piano lessons for all ages and skill levels.',
            priceCents: 500000,
            condition: 'new',
            quantity: 1,
            allowCash: true,
            allowBarter: false,
            sellerId: USERS.MUSIC,
            categoryId: jobs.id,
            imageUrl: 'https://images.unsplash.com/photo-1552422535-c45813c61732?w=500&h=500&fit=crop',
        },
    ];

    for (const listing of listings) {
        const created = await prisma.listing.upsert({
            where: { id: listing.id },
            update: {},
            create: {
                id: listing.id,
                title: listing.title,
                description: listing.description,
                priceCents: BigInt(listing.priceCents),
                currencyCode: 'NGN',
                condition: listing.condition as any,
                quantity: listing.quantity,
                allowCash: listing.allowCash,
                allowBarter: listing.allowBarter,
                sellerId: listing.sellerId,
                categoryId: listing.categoryId,
                images: {
                    create: {
                        url: listing.imageUrl,
                        sortOrder: 0,
                    },
                },
            },
        });
        console.log(`✅ Created/Updated listing: ${created.title}`);
    }

    console.log('🎉 Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
