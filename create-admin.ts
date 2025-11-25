import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Creating/Updating Admin User...\n');

    const email = 'admin@tradeplus.com';
    const password = 'password123';

    try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
            include: { profile: true }
        });

        if (existingUser) {
            console.log('📝 Admin user already exists, updating password...');

            const passwordHash = await argon2.hash(password);

            await prisma.user.update({
                where: { email },
                data: {
                    passwordHash,
                    role: 'admin',
                    status: 'active',
                    onboardingCompleted: true
                }
            });

            console.log('✅ Admin user updated successfully!');
            console.log({
                email,
                role: 'admin',
                status: 'active'
            });
        } else {
            console.log('➕ Creating new admin user...');

            const passwordHash = await argon2.hash(password);

            const newUser = await prisma.user.create({
                data: {
                    email,
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

            console.log('✅ Admin user created successfully!');
            console.log({
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                status: newUser.status,
                displayName: newUser.profile?.displayName
            });
        }

        console.log('\n📋 Login credentials:');
        console.log('Email:', email);
        console.log('Password:', password);

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
