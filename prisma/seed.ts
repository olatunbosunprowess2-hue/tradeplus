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

/**
 * seedEssentials
 * 
 * Safe for Production.
 * Only creates static data (Roles, Permissions, Categories, Countries).
 * Uses UPSERT to avoid duplicates.
 * NEVER deletes data.
 */
async function seedEssentials() {
    console.log('🌱 Seeding Essentials (Roles, Permissions, Countries, Categories)...');
    const hashedPassword = await argon2.hash('password123');

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

    // Roles with hierarchy levels
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

    // Create Countries
    let nigeria = await prisma.country.findUnique({ where: { code: 'NG' } });
    if (!nigeria) {
        nigeria = await prisma.country.create({
            data: { name: 'Nigeria', code: 'NG' }
        });
    }
    console.log(`✅ Nigeria country ensured (ID: ${nigeria.id})`);

    // Create Categories
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
    console.log('✅ Categories created');
}

/**
 * seedDevelopment
 * 
 * UNSAFE for Production.
 * Creates Mock Data (Users, Listings, Transactions).
 * May clear data tables.
 */
async function seedDevelopment() {
    console.log('🌱 Seeding Development Data (Mock Users, Listings, Monetization)...');

    // Ensure essentials exist first
    await seedEssentials();

    const hashedPassword = await argon2.hash('password123');

    // Admin User (Ensure admin exists even in dev)
    const adminRole = await prisma.role.findUnique({ where: { name: 'super_admin' } });
    await prisma.user.upsert({
        where: { email: 'admin@barterwave.com' },
        update: { role: 'admin', roleId: adminRole?.id },
        create: {
            id: USERS.ADMIN,
            email: 'admin@barterwave.com',
            passwordHash: hashedPassword,
            role: 'admin',
            roleId: adminRole?.id,
            profile: { create: { displayName: 'Admin User', bio: 'System Administrator' } },
        },
    });

    // Mock Users
    const users = [
        { id: USERS.JOHN, email: 'john@example.com', name: 'John Doe', bio: 'Tech enthusiast' },
        { id: USERS.SARAH, email: 'sarah@example.com', name: 'Sarah Smith', bio: 'Fashion blogger' },
        { id: USERS.MIKE, email: 'mike@example.com', name: 'Mike Johnson', bio: 'Fitness collector' },
        { id: USERS.FIXIT, email: 'fixit@example.com', name: 'FixIt Pro', bio: 'Plumbing Services' },
        { id: USERS.DEV, email: 'dev@example.com', name: 'CodeMaster', bio: 'Web Dev' },
        { id: USERS.MUSIC, email: 'music@example.com', name: 'Melody Music', bio: 'Music Lessons' },
    ];

    for (const u of users) {
        await prisma.user.upsert({
            where: { id: u.id },
            update: {},
            create: {
                id: u.id,
                email: u.email,
                passwordHash: hashedPassword,
                role: 'user',
                profile: { create: { displayName: u.name, bio: u.bio } },
            },
        });
    }
    console.log('✅ Mock Users created');

    // Mock Listings
    // Needs nigeria ID
    const nigeria = await prisma.country.findUnique({ where: { code: 'NG' } });
    if (!nigeria) throw new Error('Nigeria not found');

    const listings = [
        { id: LISTINGS.IPHONE, title: 'iPhone 13 Pro Max', price: 85000000, seller: USERS.JOHN, cat: 3, img: '/seed/iphone.png' },
        { id: LISTINGS.TV, title: 'Samsung 55" 4K TV', price: 45000000, seller: USERS.SARAH, cat: 1, img: '/seed/tv.png' },
        { id: LISTINGS.MACBOOK, title: 'MacBook Pro M2', price: 0, seller: USERS.JOHN, cat: 1, img: '/seed/macbook.png' },
        { id: LISTINGS.PS5, title: 'PlayStation 5', price: 55000000, seller: USERS.MIKE, cat: 1, img: '/seed/ps5.png' },
        { id: LISTINGS.HANDBAG, title: 'Designer Handbag', price: 12000000, seller: USERS.SARAH, cat: 2, img: '/seed/handbag.png' },
        { id: LISTINGS.PLUMBING, title: 'Plumbing Services', price: 1500000, seller: USERS.FIXIT, cat: 8, img: '/seed/plumbing.png' },
        { id: LISTINGS.WEBDEV, title: 'Web Development', price: 25000000, seller: USERS.DEV, cat: 8, img: '/seed/webdev.png' },
        { id: LISTINGS.PIANO, title: 'Piano Lessons', price: 500000, seller: USERS.MUSIC, cat: 10, img: '/seed/piano.png' },
    ];

    for (const l of listings) {
        await prisma.listing.upsert({
            where: { id: l.id },
            update: {},
            create: {
                id: l.id,
                title: l.title,
                description: `Description for ${l.title}`,
                priceCents: BigInt(l.price),
                currencyCode: 'NGN',
                condition: 'used',
                quantity: 1,
                allowCash: true,
                allowBarter: true,
                sellerId: l.seller,
                categoryId: l.cat,
                countryId: nigeria.id,
                images: { create: { url: l.img, sortOrder: 0 } },
            },
        });
    }
    console.log('✅ Mock Listings created');

    // Monetization (Clear & Re-seed)
    console.log('💰 Seeding monetization data...');
    await prisma.purchase.deleteMany({});
    await prisma.subscription.deleteMany({});

    // ... Add purchases/subscriptions logic here (simplified for brevity as they are just mock data)
    // For now, we accept that deleteMany happens here, but ONLY here in seedDevelopment.
    console.log('✅ Monetization data reset');
}

async function main() {
    const dbUrl = process.env.DATABASE_URL || 'unknown';

    console.log('\n=================================================');
    console.log('⚠️  WARNING: DATABASE SEEDING INITIATED');
    console.log(`🎯 TARGET DATABASE: ${dbUrl}`);
    console.log('=================================================\n');
    console.log('⏳  Starting in 5 seconds... Press Ctrl+C to cancel.');

    await new Promise(resolve => setTimeout(resolve, 5000));

    const mode = process.env.SEED_MODE || 'development';

    if (mode === 'production') {
        console.log('\n🚀  Running in PRODUCTION mode (Essentials Only)');
        console.log('🛡️   Safeupserts active. No data will be deleted.');
        await seedEssentials();
    } else {
        console.log('\n🚀  Running in DEVELOPMENT mode');
        console.log('🧨  Full reset and mock data generation.');
        await seedDevelopment();
    }

    console.log('\n🎉  Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
