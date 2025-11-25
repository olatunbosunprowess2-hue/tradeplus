import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'tysonfury@gmail.com';
    console.log(`Updating role for user: ${email}...`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error(`❌ User with email ${email} not found!`);
        process.exit(1);
    }

    const updatedUser = await prisma.user.update({
        where: { email },
        data: { role: 'admin' },
    });

    console.log(`✅ User ${updatedUser.email} role updated to: ${updatedUser.role}`);
}

main()
    .catch((e) => {
        console.error('❌ Failed to update user role:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
