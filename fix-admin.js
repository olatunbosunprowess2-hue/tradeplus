const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking for admin user...');

        // First, check if user exists
        let user = await prisma.user.findUnique({
            where: { email: 'admin@tradeplus.com' }
        });

        const hash = await argon2.hash('password123');

        if (user) {
            console.log('Admin user exists, updating...');
            user = await prisma.user.update({
                where: { email: 'admin@tradeplus.com' },
                data: {
                    passwordHash: hash,
                    role: 'admin',
                    status: 'active',
                    onboardingCompleted: true
                }
            });
            console.log('Admin user updated!');
        } else {
            console.log('Creating admin user...');
            user = await prisma.user.create({
                data: {
                    email: 'admin@tradeplus.com',
                    passwordHash: hash,
                    role: 'admin',
                    status: 'active',
                    onboardingCompleted: true
                }
            });

            // Create profile separately
            await prisma.userProfile.create({
                data: {
                    userId: user.id,
                    displayName: 'Admin User'
                }
            });
            console.log('Admin user created!');
        }

        console.log('SUCCESS! Admin credentials:');
        console.log('Email: admin@tradeplus.com');
        console.log('Password: password123');
        console.log('Role:', user.role);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
