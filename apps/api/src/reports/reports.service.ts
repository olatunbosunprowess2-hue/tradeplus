import { Injectable, BadRequestException } from '@nestjs/common';
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

        const report = await this.prisma.report.create({
            data: {
                reporterId: userId,
                reason: `${createReportDto.reason}: ${createReportDto.description}`,
                listingId: createReportDto.listingId,
                reportedUserId: createReportDto.reportedUserId,
                evidenceImages: createReportDto.evidenceImages || [],
            },
        });

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
                    reporterId: userId
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
}
