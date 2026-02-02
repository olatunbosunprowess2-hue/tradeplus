import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { ReviewAppealDto } from './dto/review-appeal.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AppealsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService
    ) { }

    async create(userId: string, createAppealDto: CreateAppealDto) {
        // Check if user is suspended or has active report
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Create the appeal
        const appeal = await this.prisma.appeal.create({
            data: {
                userId,
                reportId: createAppealDto.reportId,
                reason: createAppealDto.reason,
                message: createAppealDto.message,
                evidenceImages: createAppealDto.evidenceImages || []
            },
            include: {
                user: {
                    select: {
                        email: true,
                        profile: {
                            select: {
                                displayName: true
                            }
                        }
                    }
                }
            }
        });

        // Notify user that appeal was submitted
        await this.notificationsService.create(
            userId,
            'APPEAL_SUBMITTED',
            {
                appealId: appeal.id,
                message: 'Your appeal has been submitted successfully. Our team will review it and respond shortly.'
            }
        );

        // Notify all staff (admin, moderator, etc.) about the new appeal
        const staff = await this.prisma.user.findMany({
            where: {
                userRole: {
                    level: { gte: 50 } // Moderator level and above
                }
            },
            select: { id: true }
        });

        for (const person of staff) {
            await this.notificationsService.create(
                person.id,

                'NEW_APPEAL',
                {
                    appealId: appeal.id,
                    userId,
                    userName: user.profile?.displayName || user.email,
                    message: `New appeal from ${user.profile?.displayName || user.email}: ${createAppealDto.reason}`
                }
            );
        }

        return appeal;
    }

    async findAll(userId: string, isAdmin: boolean, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;
        const where: any = isAdmin ? {} : { userId };

        const [appeals, total] = await Promise.all([
            this.prisma.appeal.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            status: true,
                            profile: {
                                select: {
                                    displayName: true,
                                    avatarUrl: true
                                }
                            }
                        }
                    },
                    report: {
                        select: {
                            id: true,
                            reason: true,
                            status: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.appeal.count({ where })
        ]);

        return {
            data: appeals,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }


    async reviewAppeal(appealId: string, adminId: string, reviewDto: ReviewAppealDto) {
        const appeal = await this.prisma.appeal.findUnique({
            where: { id: appealId },
            include: {
                user: true,
                report: true
            }
        });

        if (!appeal) {
            throw new NotFoundException('Appeal not found');
        }

        if (appeal.status !== 'pending') {
            throw new BadRequestException('Appeal has already been reviewed');
        }

        const status = reviewDto.decision === 'approved' ? 'approved' : 'rejected';

        // Update appeal
        const updatedAppeal = await this.prisma.appeal.update({
            where: { id: appealId },
            data: {
                status,
                adminMessage: reviewDto.adminMessage,
                reviewedByAdminId: adminId,
                reviewedAt: new Date()
            }
        });

        // If approved and user was suspended, remove suspension
        if (status === 'approved' && appeal.user.status === 'suspended') {
            await this.prisma.user.update({
                where: { id: appeal.userId },
                data: { status: 'active' }
            });

            // Notify user of suspension removal
            await this.notificationsService.create(
                appeal.userId,
                'SUSPENSION_REMOVED',
                {
                    appealId: appeal.id,
                    message: reviewDto.adminMessage || 'Your appeal has been approved and your suspension has been removed. Welcome back!'
                }
            );
        } else {
            // Notify user of appeal decision
            const notificationType = status === 'approved' ? 'APPEAL_APPROVED' : 'APPEAL_REJECTED';
            const defaultMessage = status === 'approved'
                ? 'Your appeal has been approved.'
                : 'After careful review, we have decided to uphold our original decision.';

            await this.notificationsService.create(
                appeal.userId,
                notificationType,
                {
                    appealId: appeal.id,
                    message: reviewDto.adminMessage || defaultMessage
                }
            );
        }

        return updatedAppeal;
    }
}
