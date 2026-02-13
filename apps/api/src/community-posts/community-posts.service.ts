import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePostDto, UpdatePostDto, CreateCommentDto, CreatePostOfferDto, QueryPostsDto } from './dto/community-posts.dto';

@Injectable()
export class CommunityPostsService {
    constructor(
        private prisma: PrismaService,
        private notifications: NotificationsService,
    ) { }

    // ============================
    // FEED (paginated, searchable)
    // ============================
    async findAll(query: QueryPostsDto, userId?: string) {
        const page = Number(query.page) || 1;
        const limit = Math.min(Number(query.limit) || 15, 50);
        const skip = (page - 1) * limit;

        const where: any = { status: { in: ['active', 'resolved'] } };

        if (query.search) {
            const term = query.search.trim();
            where.OR = [
                { content: { contains: term, mode: 'insensitive' } },
                { hashtags: { has: term.replace(/^#/, '') } },
                { author: { profile: { displayName: { contains: term, mode: 'insensitive' } } } },
            ];
        }

        const [posts, total] = await Promise.all([
            this.prisma.communityPost.findMany({
                where,
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            isVerified: true,
                            verificationStatus: true,
                            brandVerificationStatus: true,
                            brandName: true,
                            profile: {
                                select: {
                                    displayName: true,
                                    avatarUrl: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            comments: true,
                            offers: true,
                        },
                    },
                    savedBy: userId ? {
                        where: { userId },
                        select: { id: true }
                    } : false
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.communityPost.count({ where }),
        ]);

        const data = posts.map(post => ({
            ...post,
            isSaved: userId ? (post as any).savedBy?.length > 0 : false,
            savedBy: undefined
        }));

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ============================
    // SINGLE POST
    // ============================
    async findOne(id: string) {
        const post = await this.prisma.communityPost.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        isVerified: true,
                        verificationStatus: true,
                        brandVerificationStatus: true,
                        brandName: true,
                        profile: {
                            select: { displayName: true, avatarUrl: true },
                        },
                    },
                },
                _count: { select: { comments: true, offers: true } },
            },
        });
        if (!post) throw new NotFoundException('Post not found');
        return post;
    }

    // ============================
    // CREATE
    // ============================
    async create(userId: string, dto: CreatePostDto) {
        // Extract hashtags from content if not provided
        const hashtags = dto.hashtags?.length
            ? dto.hashtags
            : (dto.content.match(/#(\w+)/g) || []).map(t => t.slice(1));

        return this.prisma.communityPost.create({
            data: {
                authorId: userId,
                content: dto.content,
                hashtags,
                images: dto.images || [],
            },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        isVerified: true,
                        verificationStatus: true,
                        brandVerificationStatus: true,
                        brandName: true,
                        profile: {
                            select: { displayName: true, avatarUrl: true },
                        },
                    },
                },
                _count: { select: { comments: true, offers: true } },
            },
        });
    }

    // ============================
    // UPDATE (own post only)
    // ============================
    async update(userId: string, postId: string, dto: UpdatePostDto) {
        const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');
        if (post.authorId !== userId) throw new ForbiddenException('You can only edit your own posts');

        const data: any = {};
        if (dto.content !== undefined) {
            data.content = dto.content;
            data.hashtags = dto.hashtags?.length
                ? dto.hashtags
                : (dto.content.match(/#(\w+)/g) || []).map(t => t.slice(1));
        }
        if (dto.images !== undefined) data.images = dto.images;
        if (dto.status !== undefined) data.status = dto.status;

        return this.prisma.communityPost.update({
            where: { id: postId },
            data,
            include: {
                author: {
                    select: {
                        id: true, firstName: true, lastName: true,
                        isVerified: true, verificationStatus: true,
                        brandVerificationStatus: true, brandName: true,
                        profile: { select: { displayName: true, avatarUrl: true } },
                    },
                },
                _count: { select: { comments: true, offers: true } },
            },
        });
    }

    // ============================
    // DELETE (own post only)
    // ============================
    async remove(userId: string, postId: string) {
        const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');
        if (post.authorId !== userId) throw new ForbiddenException('You can only delete your own posts');

        await this.prisma.communityPost.update({
            where: { id: postId },
            data: { status: 'deleted' },
        });
        return { success: true };
    }

    // ============================
    // MY POSTS
    // ============================
    async findMyPosts(userId: string, page = 1, limit = 15) {
        const skip = (page - 1) * limit;
        const where = { authorId: userId, status: { not: 'deleted' } };

        const [data, total] = await Promise.all([
            this.prisma.communityPost.findMany({
                where,
                include: {
                    author: {
                        select: {
                            id: true, firstName: true, lastName: true,
                            isVerified: true, verificationStatus: true,
                            brandVerificationStatus: true, brandName: true,
                            profile: { select: { displayName: true, avatarUrl: true } },
                        },
                    },
                    _count: { select: { comments: true, offers: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.communityPost.count({ where }),
        ]);

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ============================
    // COMMENTS
    // ============================
    async getComments(postId: string) {
        const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');

        return this.prisma.postComment.findMany({
            where: { postId },
            include: {
                author: {
                    select: {
                        id: true, firstName: true, lastName: true,
                        isVerified: true,
                        profile: { select: { displayName: true, avatarUrl: true } },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async addComment(userId: string, postId: string, dto: CreateCommentDto) {
        const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');

        const comment = await this.prisma.postComment.create({
            data: {
                postId,
                authorId: userId,
                content: dto.content,
            },
            include: {
                author: {
                    select: {
                        id: true, firstName: true, lastName: true,
                        isVerified: true,
                        profile: { select: { displayName: true, avatarUrl: true } },
                    },
                },
            },
        });

        // Notify post author (skip if they're commenting on their own post)
        if (post.authorId !== userId) {
            const commenter = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { firstName: true, profile: { select: { displayName: true } } },
            });
            const name = commenter?.profile?.displayName || commenter?.firstName || 'Someone';

            await this.notifications.create(post.authorId, 'POST_COMMENT', {
                postId,
                commentId: comment.id,
                commenterName: name,
                commentPreview: dto.content.slice(0, 100),
            });
        }

        return comment;
    }

    // ============================
    // OFFERS
    // ============================
    async makeOffer(userId: string, postId: string, dto: CreatePostOfferDto) {
        const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');
        if (post.authorId === userId) throw new ForbiddenException('You cannot make an offer on your own post');

        const offer = await this.prisma.postOffer.create({
            data: {
                postId,
                offererId: userId,
                message: dto.message,
            },
            include: {
                offerer: {
                    select: {
                        id: true, firstName: true, lastName: true,
                        isVerified: true,
                        profile: { select: { displayName: true, avatarUrl: true } },
                    },
                },
            },
        });

        // Notify post author
        const offerer = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, profile: { select: { displayName: true } } },
        });
        const name = offerer?.profile?.displayName || offerer?.firstName || 'Someone';

        await this.notifications.create(post.authorId, 'POST_OFFER', {
            postId,
            offerId: offer.id,
            offererName: name,
            offerPreview: dto.message.slice(0, 100),
        });

        return offer;
    }

    async getOffers(postId: string) {
        return this.prisma.postOffer.findMany({
            where: { postId },
            include: {
                offerer: {
                    select: {
                        id: true, firstName: true, lastName: true,
                        isVerified: true,
                        profile: { select: { displayName: true, avatarUrl: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async savePost(userId: string, postId: string) {
        try {
            await this.prisma.savedPost.create({
                data: { userId, postId }
            });
        } catch (error) {
            if (error.code !== 'P2002') throw error;
        }
        return { message: 'Post saved' };
    }

    async unsavePost(userId: string, postId: string) {
        try {
            await this.prisma.savedPost.delete({
                where: {
                    userId_postId: { userId, postId }
                }
            });
        } catch (error) {
            if (error.code !== 'P2025') throw error;
        }
        return { message: 'Post unsaved' };
    }

    async getSavedPostIds(userId: string) {
        const saved = await this.prisma.savedPost.findMany({
            where: { userId },
            select: { postId: true }
        });
        return saved.map(s => s.postId);
    }

    // ============================
    // MY OFFERS (sent + received)
    // ============================
    async getMyOffers(userId: string) {
        const offers = await this.prisma.postOffer.findMany({
            where: {
                OR: [
                    { offererId: userId },
                    { post: { authorId: userId } },
                ],
            },
            include: {
                offerer: {
                    select: {
                        id: true, firstName: true, lastName: true,
                        isVerified: true,
                        profile: { select: { displayName: true, avatarUrl: true } },
                    },
                },
                post: {
                    select: {
                        id: true, content: true, authorId: true,
                        author: {
                            select: {
                                id: true, firstName: true, lastName: true,
                                profile: { select: { displayName: true, avatarUrl: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return offers.map(o => ({
            ...o,
            type: o.offererId === userId ? 'sent' : 'received',
        }));
    }
}
