import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.user.findUnique({
        where: { email: 'admin@tradeplus.com' },
    });

    if (admin) {
        console.log('✅ Admin user found:', admin.email);
        console.log('Role:', admin.role);
    } else {
        console.error('❌ Admin user NOT found');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
