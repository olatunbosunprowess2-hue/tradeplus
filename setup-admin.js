const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        console.log('🔧 Creating/Updating Admin User...\n');

        const hash = await argon2.hash('password123');

        const user = await prisma.user.upsert({
            where: { email: 'admin@barterwave.com' },
            update: {
                passwordHash: hash,
                role: 'admin',
                status: 'active',
                onboardingCompleted: true
            },
            create: {
                email: 'admin@barterwave.com',
                passwordHash: hash,
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

        console.log('✅ Admin user ready!');
        console.log(JSON.stringify({
            email: user.email,
            role: user.role,
            status: user.status,
            displayName: user.profile?.displayName
        }, null, 2));

        console.log('\n📋 Login credentials:');
        console.log('Email: admin@barterwave.com');
        console.log('Password: password123');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
