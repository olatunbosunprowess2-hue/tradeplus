import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReportsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService
    ) { }

    async create(userId: string, createReportDto: CreateReportDto) {
        // Validate that at least one of listingId or reportedUserId is provided
        // Validate that at least one target is provided
        if (!createReportDto.listingId && !createReportDto.reportedUserId && !createReportDto.communityPostId) {
            throw new BadRequestException('Report must target a listing, a user, or a community post');
        }

        // Get seller info if listing is reported
        let listingSellerId: string | null = null;
        if (createReportDto.listingId) {
            const listing = await this.prisma.listing.findUnique({
                where: { id: createReportDto.listingId },
                select: { sellerId: true, title: true }
            });
            listingSellerId = listing?.sellerId || null;

            // Notify seller that their listing was reported
            if (listingSellerId) {
                await this.notificationsService.create(
                    listingSellerId,
                    'LISTING_REPORTED',
                    {
                        listingId: createReportDto.listingId,
                        listingTitle: listing?.title,
                        message: 'One of your listings has been reported. Our team is reviewing it. We will notify you if any action is required.'
                    }
                );
            }
        }

        // Handle Community Post Report
        if (createReportDto.communityPostId) {
            const post = await this.prisma.communityPost.findUnique({
                where: { id: createReportDto.communityPostId },
                select: { authorId: true, content: true }
            });

            // Notify post author
            if (post?.authorId) {
                await this.notificationsService.create(
                    post.authorId,
                    'POST_REPORTED',
                    {
                        postId: createReportDto.communityPostId,
                        postSnippet: post.content.substring(0, 50) + '...',
                        message: 'One of your community posts has been reported. Our team is reviewing it.',
                        link: '/community',
                    }
                );
            }
        }

        const report = await this.prisma.report.create({
            data: {
                reporterId: userId,
                reason: `${createReportDto.reason}: ${createReportDto.description}`,
                listingId: createReportDto.listingId,
                communityPostId: createReportDto.communityPostId,
                reportedUserId: createReportDto.reportedUserId,
                evidenceImages: createReportDto.evidenceImages || [],
            },
        });

        // Notify the reporter that their report was submitted
        await this.notificationsService.create(
            userId,
            'REPORT_SUBMITTED',
            {
                reportId: report.id,
                message: 'Your report has been submitted successfully. Our team will review it shortly and take appropriate action.',
                link: '/community', // Or profile, assuming reporter cares about their reports status
            }
        );

        // Notify all staff (admin, moderator, etc.) about the new report
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

                'NEW_REPORT',
                {
                    reportId: report.id,
                    reason: createReportDto.reason,
                    reporterId: userId,
                    message: `New report: ${createReportDto.reason}${createReportDto.listingId ? ' - Listing' : createReportDto.communityPostId ? ' - Post' : ' - User'}`
                }
            );
        }

        return report;
    }

    async findAll() {
        return this.prisma.report.findMany({
            include: {
                reporter: {
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
                reportedUser: {
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
                        images: {
                            take: 1,
                            select: {
                                url: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async resolveReport(reportId: string, adminMessage?: string) {
        const report = await this.prisma.report.findUnique({
            where: { id: reportId },
            include: {
                reporter: true,
                listing: true,
                reportedUser: true
            }
        });

        if (!report) {
            throw new NotFoundException('Report not found');
        }

        // Update report status
        const updatedReport = await this.prisma.report.update({
            where: { id: reportId },
            data: { status: 'resolved' }
        });

        // Notify the reporter about the resolution
        const defaultMessage = 'Your report has been reviewed and resolved by our team. Thank you for helping us maintain a safe community.';
        const notificationMessage = adminMessage || defaultMessage;

        await this.notificationsService.create(
            report.reporterId,
            'REPORT_RESOLVED',
            {
                reportId: report.id,
                message: notificationMessage,
                adminResponse: true,
                link: '/community', // Or typically wherever the report center is
            }
        );

        return updatedReport;
    }

    async deleteReportedListing(reportId: string, adminMessage?: string) {
        const report = await this.prisma.report.findUnique({
            where: { id: reportId },
            include: {
                listing: true,
                reporter: true
            }
        });

        if (!report) {
            throw new NotFoundException('Report not found');
        }

        if (!report.listingId) {
            throw new BadRequestException('This report is not for a listing');
        }

        // Delete the listing (soft delete by updating status)
        await this.prisma.listing.update({
            where: { id: report.listingId },
            data: {
                status: 'deleted',
                deletedAt: new Date()
            }
        });

        // Mark report as resolved
        await this.prisma.report.update({
            where: { id: reportId },
            data: { status: 'resolved' }
        });

        // Notify the reporter about the action taken
        const reporterDefaultMessage = 'Thank you for your report. After reviewing the evidence, we have removed the reported listing. We appreciate your help in keeping our community safe.';
        const reporterMessage = adminMessage || reporterDefaultMessage;

        await this.notificationsService.create(
            report.reporterId,
            'REPORT_RESOLVED',
            {
                reportId: report.id,
                message: reporterMessage,
                adminResponse: true,
                actionTaken: 'Listing deleted'
            }
        );

        // Notify the listing owner (reported user) about the removal
        const ownerDefaultMessage = `Your listing "${report.listing?.title}" has been removed by our moderation team after reviewing a report. Please ensure your listings comply with our community guidelines.`;
        // We might want a separate message for the owner, but for now we can use the same adminMessage if provided, 
        // or a default owner-focused one. Usually adminMessage is intended for the reporter.
        // If we want different messages, we'd need another field. 
        // For now, let's just use the default for owner unless we add another field.
        await this.notificationsService.create(
            report.listing!.sellerId,
            'LISTING_REMOVED_BY_ADMIN',
            {
                listingId: report.listingId,
                listingTitle: report.listing?.title,
                message: adminMessage || ownerDefaultMessage,
                reportId: report.id,
                timestamp: new Date(),
            }
        );

        return { message: 'Listing deleted successfully' };
    }
}
