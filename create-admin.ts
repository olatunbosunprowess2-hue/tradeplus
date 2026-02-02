import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@barterwave.com';
    const password = 'password123';

    console.log(`Creating/Updating admin user: ${email}`);

    try {
        const hashedPassword = await argon2.hash(password);

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                passwordHash: hashedPassword,
                role: 'admin',
                status: 'active'
            },
            create: {
                email,
                passwordHash: hashedPassword,
                role: 'admin',
                status: 'active',
                profile: {
                    create: {
                        displayName: 'Admin User',
                        bio: 'System Administrator',
                    }
                }
            },
            include: {
                profile: true
            }
        });

        console.log('✅ Admin user created/updated successfully');
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);

    } catch (error) {
        console.error('Error creating admin user:', error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
