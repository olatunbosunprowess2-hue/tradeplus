import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Fixing Admin Role...');

    const email = 'admin@tradeplus.com';
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.error('❌ Admin user not found!');
        return;
    }

    const superAdminRole = await prisma.role.findUnique({ where: { name: 'super_admin' } });
    if (!superAdminRole) {
        console.error('❌ super_admin role not found! Run seed first.');
        return;
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            roleId: superAdminRole.id
        }
    });

    console.log(`✅ Admin ${user.email} updated to roleId: ${superAdminRole.id} (${superAdminRole.name})`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
