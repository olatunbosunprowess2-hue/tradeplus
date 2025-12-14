
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    try {
        const passwordHash = await bcrypt.hash('password123', 10);

        // Create Admin User
        const adminEmail = 'admin@tradeplus.com';
        let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (!admin) {
            admin = await prisma.user.create({
                data: {
                    email: adminEmail,
                    passwordHash,
                    role: 'admin',
                    isVerified: true,
                    status: 'active',
                    profile: {
                        create: {
                            displayName: 'Admin User',
                            country: {
                                connectOrCreate: {
                                    where: { code: 'NG' },
                                    create: { name: 'Nigeria', code: 'NG', currencyCode: 'NGN', currencySymbol: '₦' }
                                }
                            },
                            region: {
                                create: { name: 'Lagos', countryId: 1 } // Assuming ID 1 exists or will be created. Better to query.
                            }
                        }
                    }
                }
            });
            console.log('Created admin user:', adminEmail);
        } else {
            console.log('Admin user already exists');
        }

        // Create Regular User
        const userEmail = 'user@example.com';
        let user = await prisma.user.findUnique({ where: { email: userEmail } });
        if (!user) {
            // Ensure country/region exist
            const country = await prisma.country.findFirst({ where: { code: 'NG' } });

            user = await prisma.user.create({
                data: {
                    email: userEmail,
                    passwordHash,
                    role: 'user',
                    isVerified: true,
                    status: 'active',
                    profile: {
                        create: {
                            displayName: 'Test User',
                            countryId: country?.id,
                            region: {
                                create: { name: 'Abuja', countryId: country?.id! }
                            }
                        }
                    }
                }
            });
            console.log('Created regular user:', userEmail);
        } else {
            console.log('Regular user already exists');
        }

    } catch (e) {
        console.error('Error seeding users:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
