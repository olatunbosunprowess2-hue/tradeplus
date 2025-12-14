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
        where: { email: 'admin@tradeplus.com' },
        update: {
            role: 'admin',
            passwordHash: hashedPassword,
            roleId: adminRole?.id
        },
        create: {
            id: USERS.ADMIN,
            email: 'admin@tradeplus.com',
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

    // Create Countries and Regions
    const nigeria = await prisma.country.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, name: 'Nigeria', code: 'NG' },
    });

    const regions = [
        { id: 1, name: 'Lagos', countryId: 1 },
        { id: 2, name: 'Abuja', countryId: 1 },
        { id: 3, name: 'Rivers', countryId: 1 },
        { id: 4, name: 'Ogun', countryId: 1 },
        { id: 5, name: 'Kano', countryId: 1 },
    ];

    for (const region of regions) {
        await prisma.region.upsert({
            where: { id: region.id },
            update: {},
            create: { id: region.id, name: region.name, countryId: region.countryId },
        });
    }
    console.log('✅ Locations created');

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
                countryId: 1, // Default to Nigeria
                regionId: listing.regionId,
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
