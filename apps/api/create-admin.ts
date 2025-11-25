import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';

dotenv.config({ path: 'apps/api/.env' });

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://user:password@localhost:5432/tradeplus?schema=public',
        },
    },
});

async function main() {
    console.log('Creating admin user...');
    const hashedPassword = await argon2.hash('password123');

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@tradeplus.com' },
        update: { role: 'admin', passwordHash: hashedPassword },
        create: {
            email: 'admin@tradeplus.com',
            passwordHash: hashedPassword,
            role: 'admin',
            profile: {
                create: {
                    displayName: 'Admin User',
                    bio: 'System Administrator',
                },
            },
        },
    });

    console.log('✅ Admin user created/updated:', adminUser.email);
}

main()
    .catch((e) => {
        console.error('❌ Failed to create admin user:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
