import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Community Posts...');

    // Get some users (include profile for displayName fallback)
    const users = await prisma.user.findMany({ take: 5, include: { profile: true } });
    if (users.length === 0) {
        console.error('No users found. Run the main seed first.');
        return;
    }

    const authors = users.slice(0, 3);
    const commenters = users.slice(2, 5);

    // Create 10 posts
    for (const author of authors) {
        for (let i = 0; i < 3; i++) {
            const authorName = author.firstName || (author as any).profile?.displayName || 'Community Member';
            const post = await prisma.communityPost.create({
                data: {
                    authorId: author.id,
                    content: `This is a sample community post #${i + 1} from ${authorName}. Looking to trade some electronics and gaming gear! #gaming #trade`,
                    hashtags: ['gaming', 'trade'],
                    images: i % 2 === 0 ? ['https://images.unsplash.com/photo-1552831388-6a0b3575b32a?w=800'] : [],
                    status: 'active',
                },
            });

            console.log(`Created post ${post.id}`);

            // Add comments
            await prisma.postComment.create({
                data: {
                    postId: post.id,
                    authorId: commenters[0].id,
                    content: 'Interested! validation works?',
                },
            });

            // Add offers
            if (i === 1) {
                await prisma.postOffer.create({
                    data: {
                        postId: post.id,
                        offererId: commenters[1].id,
                        message: 'I have a Nintendo Switch to trade.',
                    },
                });
            }
        }
    }

    console.log('✅ Community Seed Complete');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
