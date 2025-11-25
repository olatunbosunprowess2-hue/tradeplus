import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const email = 'tysonfury@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (user) {
        fs.writeFileSync('role_status.txt', `User: ${user.email}, Role: ${user.role}`);
    } else {
        fs.writeFileSync('role_status.txt', `User ${email} not found`);
    }
}

main()
    .catch((e) => {
        fs.writeFileSync('role_status.txt', `Error: ${e.message}`);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
