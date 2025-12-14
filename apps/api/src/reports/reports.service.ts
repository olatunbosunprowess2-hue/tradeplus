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
        if (!createReportDto.listingId && !createReportDto.reportedUserId) {
            throw new BadRequestException('Report must target either a listing or a user');
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

        const report = await this.prisma.report.create({
            data: {
                reporterId: userId,
                reason: `${createReportDto.reason}: ${createReportDto.description}`,
                listingId: createReportDto.listingId,
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
                message: 'Your report has been submitted successfully. Our team will review it shortly and take appropriate action.'
            }
        );

        // Notify all admins about the new report
        const admins = await this.prisma.user.findMany({
            where: { role: 'admin' },
            select: { id: true }
        });

        for (const admin of admins) {
            await this.notificationsService.create(
                admin.id,
                'NEW_REPORT',
                {
                    reportId: report.id,
                    reason: createReportDto.reason,
                    reporterId: userId,
                    message: `New report: ${createReportDto.reason}${createReportDto.listingId ? ' - Listing reported' : ' - User reported'}`
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
                adminResponse: true
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
        const defaultMessage = 'Thank you for your report. After reviewing the evidence, we have removed the reported listing. We appreciate your help in keeping our community safe.';
        const notificationMessage = adminMessage || defaultMessage;

        await this.notificationsService.create(
            report.reporterId,
            'REPORT_RESOLVED',
            {
                reportId: report.id,
                message: notificationMessage,
                adminResponse: true,
                actionTaken: 'Listing deleted'
            }
        );

        return { message: 'Listing deleted successfully' };
    }
}
