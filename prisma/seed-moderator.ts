import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    const email = 'moderator@barterwave.com';
    const password = 'password123';
    const hashedPassword = await argon2.hash(password);

    // 1. Ensure 'moderator' role exists
    let moderatorRole = await prisma.role.findUnique({
        where: { name: 'moderator' },
    });

    if (!moderatorRole) {
        console.log('Creating moderator role...');
        moderatorRole = await prisma.role.create({
            data: {
                name: 'moderator',
                description: 'Content moderation and user management',
                level: 60,
            },
        });
    }

    // 2. Create or Update Moderator User
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        console.log('Updating existing moderator user...');
        await prisma.user.update({
            where: { email },
            data: {
                passwordHash: hashedPassword,
                role: 'moderator', // Legacy field
                roleId: moderatorRole.id, // New RBAC field
                verificationStatus: 'VERIFIED',
            },
        });
    } else {
        console.log('Creating new moderator user...');
        await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                firstName: 'Mod',
                lastName: 'User',
                role: 'moderator', // Legacy field
                verificationStatus: 'VERIFIED',
                userRole: {
                    connect: { id: moderatorRole.id }
                }
            },
        });
    }

    console.log('Moderator seeded successfully');
    console.log('Email:', email);
    console.log('Password:', password);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
