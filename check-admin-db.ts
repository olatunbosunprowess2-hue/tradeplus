import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking database connection and admin user...\n');

    try {
        // Test connection
        await prisma.$connect();
        console.log('✅ Database connected successfully\n');

        // Check for admin user
        const adminUser = await prisma.user.findUnique({
            where: { email: 'admin@tradeplus.com' },
            include: { profile: true }
        });

        if (adminUser) {
            console.log('✅ Admin user found:');
            console.log({
                id: adminUser.id,
                email: adminUser.email,
                role: adminUser.role,
                status: adminUser.status,
                displayName: adminUser.profile?.displayName
            });
        } else {
            console.log('❌ Admin user NOT found!');
            console.log('Creating admin user...\n');

            const argon2 = require('argon2');
            const passwordHash = await argon2.hash('password123');

            const newAdmin = await prisma.user.create({
                data: {
                    email: 'admin@tradeplus.com',
                    passwordHash,
                    role: 'admin',
                    status: 'active',
                    onboardingCompleted: true,
                    profile: {
                        create: {
                            displayName: 'Admin User'
                        }
                    }
                },
                include: { profile: true }
            });

            console.log('✅ Admin user created:');
            console.log({
                id: newAdmin.id,
                email: newAdmin.email,
                role: newAdmin.role,
                status: newAdmin.status
            });
        }
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
