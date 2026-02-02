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

    // Create RBAC Roles & Permissions
    const PERMISSIONS = [
        // User management
        { name: 'user.view', group: 'user', description: 'View user profiles and lists' },
        { name: 'user.create', group: 'user', description: 'Create new users' },
        { name: 'user.update', group: 'user', description: 'Update user details' },
        { name: 'user.delete', group: 'user', description: 'Soft delete users' },
        { name: 'user.ban', group: 'user', description: 'Ban/suspend users' },
        // Role management
        { name: 'role.view', group: 'role', description: 'View roles and permissions' },
        { name: 'role.create', group: 'role', description: 'Create new roles' },
        { name: 'role.update', group: 'role', description: 'Update role permissions' },
        { name: 'role.delete', group: 'role', description: 'Delete roles' },
        { name: 'role.assign', group: 'role', description: 'Assign roles to users' },
        // Reports
        { name: 'report.view', group: 'report', description: 'View reports' },
        { name: 'report.resolve', group: 'report', description: 'Resolve/dismiss reports' },
        // Listings
        { name: 'listing.view', group: 'listing', description: 'View all listings' },
        { name: 'listing.delete', group: 'listing', description: 'Delete/remove listings' },
        { name: 'listing.promote', group: 'listing', description: 'Promote/feature listings' },
        // Chat/Messages
        { name: 'chat.view', group: 'chat', description: 'View user chats (admin oversight)' },
        { name: 'chat.note', group: 'chat', description: 'Add internal notes to chats' },
        // Analytics
        { name: 'analytics.view', group: 'analytics', description: 'View analytics dashboards' },
        { name: 'analytics.export', group: 'analytics', description: 'Export analytics data' },
        // Audit
        { name: 'audit.view', group: 'audit', description: 'View audit logs' },
        // Security
        { name: 'security.view', group: 'security', description: 'View security alerts' },
        { name: 'security.block', group: 'security', description: 'Block IPs' },
    ];

    for (const perm of PERMISSIONS) {
        await prisma.permission.upsert({
            where: { name: perm.name },
            update: { description: perm.description },
            create: { name: perm.name, group: perm.group, description: perm.description }
        });
    }
    console.log('✅ Permissions seeded');

    // Roles with hierarchy levels (higher = more power)
    // super_admin (100): Full access, can create/demote other super_admins
    // admin (80): Everything except touching super_admin accounts
    // moderator (60): Approve/reject ads, ban users, handle reports, view chats
    // support (40): Read-only on tickets and chats, can add internal notes
    // analytics_viewer (20): Only dashboards and exports
    const ROLES = [
        { name: 'super_admin', level: 100, isSystem: true, description: 'Full system access' },
        { name: 'admin', level: 80, isSystem: true, description: 'Full access except super_admin management' },
        { name: 'moderator', level: 60, isSystem: false, description: 'Content moderation and user management' },
        { name: 'support', level: 40, isSystem: false, description: 'Customer support with read access' },
        { name: 'analytics_viewer', level: 20, isSystem: false, description: 'Analytics and reporting access only' },
        { name: 'user', level: 0, isSystem: true, description: 'Regular user' },
    ];

    for (const role of ROLES) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: { level: role.level, isSystem: role.isSystem, description: role.description },
            create: { name: role.name, level: role.level, isSystem: role.isSystem, description: role.description }
        });
    }
    console.log('✅ Roles seeded');

    // Create admin user
    const adminRole = await prisma.role.findUnique({ where: { name: 'super_admin' } });

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@barterwave.com' },
        update: {
            role: 'admin',
            passwordHash: hashedPassword,
            roleId: adminRole?.id
        },
        create: {
            id: USERS.ADMIN,
            email: 'admin@barterwave.com',
            passwordHash: hashedPassword,
            role: 'admin',
            roleId: adminRole?.id,
            profile: {
                create: {
                    displayName: 'Admin User',
                    bio: 'System Administrator',
                },
            },
        },
    });

    console.log('✅ Users created (including admin)');

    console.log('✅ Users created (including admin)');

    // Create Countries (Dynamic sync via service)
    // We don't need to manually create regions here anymore.
    // However, for the seed listings to work, we ensure Nigeria exists in the DB.
    let nigeria = await prisma.country.findUnique({ where: { code: 'NG' } });
    if (!nigeria) {
        nigeria = await prisma.country.create({
            data: { name: 'Nigeria', code: 'NG' }
        });
    }
    console.log(`✅ Nigeria country ensured (ID: ${nigeria.id})`);

    // Create categories - Comprehensive list for African marketplace
    const categories = [
        { id: 1, name: 'Electronics', slug: 'electronics' },
        { id: 2, name: 'Fashion', slug: 'fashion' },
        { id: 3, name: 'Mobile Phones & Tablets', slug: 'mobile-phones' },
        { id: 4, name: 'Home & Garden', slug: 'home-garden' },
        { id: 5, name: 'Sports & Outdoors', slug: 'sports' },
        { id: 6, name: 'Beauty & Health', slug: 'beauty' },
        { id: 7, name: 'Vehicles', slug: 'vehicles' },
        { id: 8, name: 'Services', slug: 'services' },
        { id: 9, name: 'Books & Media', slug: 'books' },
        { id: 10, name: 'Jobs', slug: 'jobs' },
        // Additional categories for comprehensive coverage
        { id: 11, name: 'Computers & Laptops', slug: 'computers' },
        { id: 12, name: 'Gaming', slug: 'gaming' },
        { id: 13, name: 'Furniture', slug: 'furniture' },
        { id: 14, name: 'Real Estate', slug: 'real-estate' },
        { id: 15, name: 'Baby & Kids', slug: 'baby-kids' },
        { id: 16, name: 'Musical Instruments', slug: 'musical-instruments' },
        { id: 17, name: 'Agriculture & Food', slug: 'agriculture' },
        { id: 18, name: 'Building Materials', slug: 'building-materials' },
        { id: 19, name: 'Jewelry & Watches', slug: 'jewelry' },
        { id: 20, name: 'Appliances', slug: 'appliances' },
        { id: 21, name: 'Art & Collectibles', slug: 'art-collectibles' },
        { id: 22, name: 'Photography', slug: 'photography' },
        { id: 23, name: 'Pets & Animals', slug: 'pets' },
        { id: 24, name: 'Office Equipment', slug: 'office' },
        { id: 25, name: 'Other', slug: 'other' },
    ];

    for (const category of categories) {
        await prisma.category.upsert({
            where: { id: category.id },
            update: { name: category.name, slug: category.slug },
            create: { id: category.id, name: category.name, slug: category.slug },
        });
    }

    // Reference variables for backward compatibility with existing seed data
    const electronics = { id: 1 };
    const fashion = { id: 2 };
    const mobilePhones = { id: 3 };
    const services = { id: 8 };
    const jobs = { id: 10 };

    console.log('✅ Categories created (25 categories)');

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
            imageUrl: '/seed/iphone.png',
            regionId: 1, // Lagos
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
            imageUrl: '/seed/tv.png',
            regionId: 2, // Abuja
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
            imageUrl: '/seed/macbook.png',
            regionId: 1, // Lagos
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
            imageUrl: '/seed/ps5.png',
            regionId: 3, // Rivers
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
            imageUrl: '/seed/handbag.png',
            regionId: 2, // Abuja
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
            imageUrl: '/seed/plumbing.png',
            regionId: 1, // Lagos
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
            imageUrl: '/seed/webdev.png',
            regionId: 1, // Lagos
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
            imageUrl: '/seed/piano.png',
            regionId: 2, // Abuja
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
                countryId: nigeria.id,
                regionId: undefined, // Let regions be dynamic
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

    // ==========================================
    // MONETIZATION SEED DATA
    // ==========================================
    console.log('💰 Seeding monetization data...');

    // Clear existing monetization data first
    await prisma.purchase.deleteMany({});
    await prisma.subscription.deleteMany({});
    console.log('🗑️ Cleared existing purchases and subscriptions');

    // Create sample purchases (completed transactions)
    const purchases = [
        {
            userId: USERS.JOHN,
            type: 'spotlight_3',
            amountCents: 200000, // ₦2,000
            listingId: LISTINGS.IPHONE,
            status: 'completed',
            paystackRef: 'PSK_test_1234567890',
        },
        {
            userId: USERS.SARAH,
            type: 'spotlight_7',
            amountCents: 400000, // ₦4,000
            listingId: LISTINGS.TV,
            status: 'completed',
            paystackRef: 'PSK_test_2345678901',
        },
        {
            userId: USERS.MIKE,
            type: 'cross_list',
            amountCents: 150000, // ₦1,500
            listingId: LISTINGS.PS5,
            status: 'completed',
            paystackRef: 'PSK_test_3456789012',
        },
        {
            userId: USERS.JOHN,
            type: 'chat_pass',
            amountCents: 150000, // ₦1,500
            listingId: null,
            status: 'completed',
            paystackRef: 'PSK_test_4567890123',
        },
        {
            userId: USERS.SARAH,
            type: 'aggressive_boost',
            amountCents: 400000, // ₦4,000
            listingId: LISTINGS.HANDBAG,
            status: 'completed',
            paystackRef: 'PSK_test_5678901234',
        },
    ];

    for (const purchase of purchases) {
        await prisma.purchase.create({
            data: {
                userId: purchase.userId,
                type: purchase.type,
                amountCents: purchase.amountCents,
                listingId: purchase.listingId,
                status: purchase.status,
                paystackRef: purchase.paystackRef,
            },
        });
    }
    console.log('✅ Created sample purchases');

    // Create sample subscriptions
    const subscriptions = [
        {
            userId: USERS.JOHN,
            status: 'active',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            paystackSubCode: 'SUB_test_john123',
        },
        {
            userId: USERS.DEV,
            status: 'active',
            expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
            paystackSubCode: 'SUB_test_dev456',
        },
    ];

    for (const sub of subscriptions) {
        await prisma.subscription.create({
            data: {
                userId: sub.userId,
                status: sub.status,
                expiresAt: sub.expiresAt,
                paystackSubCode: sub.paystackSubCode,
            },
        });
    }
    console.log('✅ Created sample subscriptions');

    // Update some listings to be spotlighted/cross-listed
    // Make iPhone a spotlight item
    await prisma.listing.update({
        where: { id: LISTINGS.IPHONE },
        data: {
            isFeatured: true,
            spotlightExpiry: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        },
    });

    // Make TV a spotlight item
    await prisma.listing.update({
        where: { id: LISTINGS.TV },
        data: {
            isFeatured: true,
            spotlightExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
    });

    // Make PS5 a distress sale with cross-listing
    await prisma.listing.update({
        where: { id: LISTINGS.PS5 },
        data: {
            isDistressSale: true,
            isCrossListed: true,
        },
    });

    // Make Handbag a distress sale with aggressive boost
    await prisma.listing.update({
        where: { id: LISTINGS.HANDBAG },
        data: {
            isDistressSale: true,
            isCrossListed: true,
            pushNotificationSent: true,
        },
    });

    console.log('✅ Updated listings with spotlight/distress status');
    console.log('💰 Monetization seeding complete!');

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
