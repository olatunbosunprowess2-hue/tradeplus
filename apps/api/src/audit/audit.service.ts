import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async log(userId: string, action: string, targetUserId?: string, details?: any) {
        return this.prisma.auditLog.create({
            data: {
                userId,
                action,
                targetUserId,
                details: details || {},
            },
        });
    }

    async getLogs(limit = 50) {
        return this.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { user: true, targetUser: true }
        });
    }
}
