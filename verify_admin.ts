import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';

dotenv.config({ path: 'apps/api/.env' });

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Verifying Admin User...');

    const email = 'admin@tradeplus.com';
    const password = 'password123';

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error('❌ Admin user NOT found!');
        return;
    }

    console.log('✅ Admin user found:', {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
    });

    const isPasswordValid = await argon2.verify(user.passwordHash, password);

    if (isPasswordValid) {
        console.log('✅ Password matches!');
    } else {
        console.error('❌ Password does NOT match!');
    }
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
