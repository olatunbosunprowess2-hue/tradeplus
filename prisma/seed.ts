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
    const countries = [
        { code: 'US', name: 'United States' },
        { code: 'GB', name: 'United Kingdom' },
        { code: 'NG', name: 'Nigeria' }
    ];

    for (const c of countries) {
        await prisma.country.upsert({
            where: { code: c.code },
            update: { name: c.name },
            create: { name: c.name, code: c.code }
        });
    }
    console.log('✅ Base countries ensured');

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
        update: {
            role: 'admin',
            roleId: adminRole?.id,
            firstName: 'Admin',
            lastName: 'User',
            city: 'New York',
            state: 'NY',
            locationAddress: 'Manhattan, NY, USA',
        },
        create: {
            id: USERS.ADMIN,
            email: 'admin@barterwave.com',
            passwordHash: hashedPassword,
            role: 'admin',
            roleId: adminRole?.id,
            firstName: 'Admin',
            lastName: 'User',
            city: 'New York',
            state: 'NY',
            locationAddress: 'Manhattan, NY, USA',
            profile: { create: { displayName: 'Admin User', bio: 'System Administrator' } },
        },
    });

    // Mock Users
    const users = [
        { id: USERS.JOHN, email: 'john@example.com', firstName: 'John', lastName: 'Doe', name: 'John Doe', bio: 'Tech enthusiast', city: 'New York', state: 'NY', address: 'Brooklyn, NY, USA' },
        { id: USERS.SARAH, email: 'sarah@example.com', firstName: 'Sarah', lastName: 'Smith', name: 'Sarah Smith', bio: 'Fashion blogger', city: 'London', state: 'ENG', address: 'Camden Town, London, UK' },
        { id: USERS.MIKE, email: 'mike@example.com', firstName: 'Mike', lastName: 'Johnson', name: 'Mike Johnson', bio: 'Fitness collector', city: 'Los Angeles', state: 'CA', address: 'Beverly Hills, CA, USA' },
        { id: USERS.FIXIT, email: 'fixit@example.com', firstName: 'Felix', lastName: 'Okafor', name: 'FixIt Pro', bio: 'Plumbing Services', city: 'Lagos', state: 'Lagos', address: 'Bodija, Lagos, Nigeria' },
        { id: USERS.DEV, email: 'dev@example.com', firstName: 'David', lastName: 'Eze', name: 'CodeMaster', bio: 'Web Dev', city: 'San Francisco', state: 'CA', address: 'SOMA, SF, USA' },
        { id: USERS.MUSIC, email: 'music@example.com', firstName: 'Melody', lastName: 'Nwosu', name: 'Melody Music', bio: 'Music Lessons', city: 'London', state: 'ENG', address: 'SoHo, London, UK' },
        // --- Dedicated Trade Test Users ---
        { id: 'bbbbbbbb-0000-0000-0000-000000000001', email: 'testbuyer@barterwave.com', firstName: 'Test', lastName: 'Buyer', name: 'Test Buyer', bio: 'Professional Trade Tester', city: 'New York', state: 'NY', address: 'Test Lab', isVerified: true, isEmailVerified: true },
        { id: 'bbbbbbbb-0000-0000-0000-000000000002', email: 'testseller@barterwave.com', firstName: 'Test', lastName: 'Seller', name: 'Test Seller', bio: 'Professional Trade Tester', city: 'New York', state: 'NY', address: 'Test Lab', isVerified: true, isEmailVerified: true },
    ];

    for (const u of users) {
        await prisma.user.upsert({
            where: { id: u.id },
            update: {
                firstName: u.firstName,
                lastName: u.lastName,
                city: u.city,
                state: u.state,
                locationAddress: u.address,
                isVerified: u.isVerified ?? false,
                isEmailVerified: u.isEmailVerified ?? u.isVerified ?? false,
                onboardingCompleted: true,
            },
            create: {
                id: u.id,
                email: u.email,
                passwordHash: hashedPassword,
                role: 'user',
                firstName: u.firstName,
                lastName: u.lastName,
                city: u.city,
                state: u.state,
                locationAddress: u.address,
                isVerified: u.isVerified ?? false,
                isEmailVerified: u.isEmailVerified ?? u.isVerified ?? false,
                onboardingCompleted: true,
                profile: { create: { displayName: u.name, bio: u.bio } },
            },
        });
    }
    console.log('✅ Mock Users created');

    // Mock Listings
    const usInfo = await prisma.country.findUnique({ where: { code: 'US' } });
    const ukInfo = await prisma.country.findUnique({ where: { code: 'GB' } });
    const ngInfo = await prisma.country.findUnique({ where: { code: 'NG' } });

    const listings = [
        { id: LISTINGS.IPHONE, title: 'iPhone 13 Pro Max', price: 85000, seller: USERS.JOHN, cat: 3, img: '/seed/iphone.png', cur: 'USD', country: usInfo?.id },
        { id: LISTINGS.TV, title: 'Samsung 55" 4K TV', price: 45000, seller: USERS.SARAH, cat: 1, img: '/seed/tv.png', cur: 'GBP', country: ukInfo?.id },
        { id: LISTINGS.MACBOOK, title: 'MacBook Pro M2', price: 0, seller: USERS.JOHN, cat: 1, img: '/seed/macbook.png', cur: 'USD', country: usInfo?.id },
        { id: LISTINGS.PS5, title: 'PlayStation 5', price: 55000, seller: USERS.MIKE, cat: 1, img: '/seed/ps5.png', cur: 'USD', country: usInfo?.id },
        { id: LISTINGS.HANDBAG, title: 'Designer Handbag', price: 12000, seller: USERS.SARAH, cat: 2, img: '/seed/handbag.png', cur: 'GBP', country: ukInfo?.id },
        { id: LISTINGS.PLUMBING, title: 'Plumbing Services', price: 1500000, seller: USERS.FIXIT, cat: 8, img: '/seed/plumbing.png', cur: 'NGN', country: ngInfo?.id },
        { id: LISTINGS.WEBDEV, title: 'Web Development', price: 25000, seller: USERS.DEV, cat: 8, img: '/seed/webdev.png', cur: 'USD', country: usInfo?.id },
        { id: LISTINGS.PIANO, title: 'Piano Lessons', price: 5000, seller: USERS.MUSIC, cat: 10, img: '/seed/piano.png', cur: 'GBP', country: ukInfo?.id },
        // --- Dedicated Trade Test Listings ---
        { id: 'cccccccc-0000-0000-0000-000000000001', title: 'Vintage Leather Jacket (Test Item 1)', price: 5000, seller: 'bbbbbbbb-0000-0000-0000-000000000002', cat: 2, img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop', cur: 'USD', country: usInfo?.id },
        { id: 'cccccccc-0000-0000-0000-000000000002', title: 'Wireless Headphones (Test Item 2)', price: 12000, seller: 'bbbbbbbb-0000-0000-0000-000000000002', cat: 1, img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop', cur: 'USD', country: usInfo?.id },
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
                currencyCode: l.cur,
                condition: 'used',
                quantity: 1,
                allowCash: true,
                allowBarter: true,
                sellerId: l.seller,
                categoryId: l.cat,
                countryId: l.country,
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
