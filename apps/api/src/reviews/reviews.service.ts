import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReviewsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService
    ) { }

    async create(userId: string, createReviewDto: CreateReviewDto) {
        const { orderId, rating, comment } = createReviewDto;

        // Verify order exists and is completed
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        listing: true,
                    },
                },
                buyer: true,
                seller: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Check if order is fulfilled
        if (order.status !== 'fulfilled') {
            throw new BadRequestException('Can only review completed orders');
        }

        // Check if user is part of this order
        if (order.buyerId !== userId && order.sellerId !== userId) {
            throw new ForbiddenException('You can only review your own orders');
        }

        // Check if review already exists
        const existingReview = await this.prisma.review.findUnique({
            where: { orderId },
        });

        if (existingReview) {
            throw new BadRequestException('Order already reviewed');
        }

        // Determine who is being reviewed
        const revieweeId = order.buyerId === userId ? order.sellerId : order.buyerId;

        // Get the first listing from order items
        const firstListing = order.items[0]?.listing;
        if (!firstListing) {
            throw new BadRequestException('Order has no items');
        }

        // Create review
        const review = await this.prisma.review.create({
            data: {
                rating,
                comment,
                orderId,
                reviewerId: userId,
                revieweeId,
                listingId: firstListing.id,
            },
            include: {
                reviewer: {
                    select: {
                        id: true,
                        email: true,
                        profile: {
                            select: {
                                displayName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                reviewee: {
                    select: {
                        id: true,
                        email: true,
                        profile: {
                            select: {
                                displayName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                listing: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        // Update reviewee's average rating
        await this.updateUserRating(revieweeId);

        // Notify the user who was reviewed
        await this.notificationsService.create(
            revieweeId,
            'NEW_REVIEW',
            {
                reviewId: review.id,
                reviewerId: userId,
                rating: rating,
                listingId: firstListing.id
            }
        );

        return review;
    }

    async findAll(query: ReviewQueryDto) {
        const { userId, listingId, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const where: any = {
            isPublic: true,
        };

        if (userId) {
            where.revieweeId = userId;
        }

        if (listingId) {
            where.listingId = listingId;
        }

        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    reviewer: {
                        select: {
                            id: true,
                            email: true,
                            profile: {
                                select: {
                                    displayName: true,
                                    avatarUrl: true,
                                },
                            },
                        },
                    },
                    listing: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            }),
            this.prisma.review.count({ where }),
        ]);

        return {
            reviews,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const review = await this.prisma.review.findUnique({
            where: { id },
            include: {
                reviewer: {
                    select: {
                        id: true,
                        email: true,
                        profile: {
                            select: {
                                displayName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                reviewee: {
                    select: {
                        id: true,
                        email: true,
                        profile: {
                            select: {
                                displayName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                listing: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        return review;
    }

    async update(id: string, userId: string, updateReviewDto: UpdateReviewDto) {
        const review = await this.prisma.review.findUnique({
            where: { id },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        if (review.reviewerId !== userId) {
            throw new ForbiddenException('You can only update your own reviews');
        }

        const updated = await this.prisma.review.update({
            where: { id },
            data: updateReviewDto,
            include: {
                reviewer: {
                    select: {
                        id: true,
                        email: true,
                        profile: {
                            select: {
                                displayName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                listing: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        // Recalculate rating if rating was updated
        if (updateReviewDto.rating !== undefined) {
            await this.updateUserRating(review.revieweeId);
        }

        return updated;
    }

    async remove(id: string, userId: string) {
        const review = await this.prisma.review.findUnique({
            where: { id },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        if (review.reviewerId !== userId) {
            throw new ForbiddenException('You can only delete your own reviews');
        }

        const revieweeId = review.revieweeId;

        await this.prisma.review.delete({
            where: { id },
        });

        // Update reviewee's average rating
        await this.updateUserRating(revieweeId);

        return { message: 'Review deleted successfully' };
    }

    async flag(id: string, userId: string) {
        const review = await this.prisma.review.findUnique({
            where: { id },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        if (review.reviewerId === userId) {
            throw new BadRequestException('You cannot flag your own review');
        }

        await this.prisma.review.update({
            where: { id },
            data: { flagged: true },
        });

        return { message: 'Review flagged for moderation' };
    }

    async moderate(id: string, moderateReviewDto: ModerateReviewDto) {
        const review = await this.prisma.review.findUnique({
            where: { id },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        return this.prisma.review.update({
            where: { id },
            data: moderateReviewDto,
        });
    }

    async getFlaggedReviews() {
        return this.prisma.review.findMany({
            where: { flagged: true },
            include: {
                reviewer: {
                    select: {
                        id: true,
                        email: true,
                        profile: {
                            select: {
                                displayName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                reviewee: {
                    select: {
                        id: true,
                        email: true,
                        profile: {
                            select: {
                                displayName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                listing: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    private async updateUserRating(userId: string) {
        const reviews = await this.prisma.review.findMany({
            where: {
                revieweeId: userId,
                isPublic: true,
            },
            select: {
                rating: true,
            },
        });

        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                totalReviews,
                averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            },
        });
    }
}
