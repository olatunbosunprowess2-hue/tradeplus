import { Injectable, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
    private readonly logger = new Logger(RolesService.name);

    constructor(
        private prisma: PrismaService,
        private audit: AuditService,
        private notifications: NotificationsService,
        private email: EmailService,
    ) { }

    async findAll() {
        return this.prisma.role.findMany({
            include: { permissions: true, _count: { select: { users: true } } },
            orderBy: { level: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.role.findUnique({
            where: { id },
            include: { permissions: true },
        });
    }

    async create(dto: CreateRoleDto, adminId: string) {
        return this.prisma.role.create({
            data: {
                name: dto.name,
                level: dto.level,
                description: dto.description,
                permissions: {
                    connect: dto.permissionIds?.map(id => ({ id })) || []
                }
            },
        });
    }

    async assignRole(userId: string, roleId: string | null | undefined, adminId: string) {
        this.logger.log(`Assigning role: Admin=${adminId}, TargetUser=${userId}, NewRole=${roleId}`);

        const admin = await this.prisma.user.findUnique({ where: { id: adminId }, include: { userRole: true } });

        if (!admin || !admin.userRole) {
            this.logger.error(`Admin invalid: ${adminId}`);
            throw new BadRequestException('Invalid admin permissions');
        }

        // Removal Case
        if (!roleId) {
            // Removing role = setting to null
            // Check if target has a higher role? Optional, but good practice.
            const targetUser = await this.prisma.user.findUnique({ where: { id: userId }, include: { userRole: true, profile: true } });
            if (targetUser?.userRole && targetUser.userRole.level >= admin.userRole.level && admin.userRole.name !== 'super_admin') {
                throw new ForbiddenException('Cannot remove role from a user with equal/higher level');
            }

            const updated = await this.prisma.user.update({
                where: { id: userId },
                data: {
                    roleId: null,
                    role: 'user'
                },
            });

            await this.audit.log(adminId, 'ROLE_REMOVED', userId, { previousRole: targetUser?.userRole?.name });

            // Notify user about role removal
            const previousRoleName = targetUser?.userRole?.name?.replace('_', ' ') || 'team member';
            await this.notifications.create(
                userId,
                'ROLE_REMOVED',
                {
                    message: `Your ${previousRoleName} role has been removed. You are now a regular user.`,
                    previousRole: targetUser?.userRole?.name,
                    timestamp: new Date()
                }
            );

            // Send role removed email
            if (targetUser?.email) {
                await this.email.sendRoleRemoved(
                    targetUser.email,
                    targetUser.profile?.displayName || targetUser.firstName || 'User',
                    previousRoleName
                );
            }

            return updated;
        }

        // Assignment Case
        const targetRole = await this.prisma.role.findUnique({ where: { id: roleId } });
        if (!targetRole) {
            throw new BadRequestException('Target role not found');
        }

        // Hierarchy Check
        if (admin.userRole.name !== 'super_admin' && admin.userRole.level <= targetRole.level) {
            throw new ForbiddenException('Cannot assign a role equal or higher than your own');
        }

        // Sync legacy role field
        let legacyRole = 'user';
        if (['admin', 'super_admin'].includes(targetRole.name)) {
            legacyRole = 'admin';
        }

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                roleId,
                role: legacyRole
            },
        });

        await this.audit.log(
            adminId,
            'ROLE_ASSIGNED',
            userId,
            { roleId, roleName: targetRole.name, legacyRole }
        );

        // Notify user about new role
        const roleName = targetRole.name.replace('_', ' ');
        const roleDescriptions: Record<string, string> = {
            'super admin': 'full platform control including user management',
            'admin': 'administrative access to manage users and content',
            'moderator': 'content moderation and user support capabilities',
            'support': 'access to help users and respond to inquiries',
            'analytics viewer': 'view platform analytics and reports'
        };
        const description = roleDescriptions[roleName] || 'special administrative capabilities';

        await this.notifications.create(
            userId,
            'ROLE_ASSIGNED',
            {
                message: `🎉 Congratulations! You've been appointed as ${roleName}. You now have ${description}.`,
                roleName: targetRole.name,
                roleLevel: targetRole.level,
                timestamp: new Date()
            }
        );

        // Send role assigned email
        const targetUser = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true }
        });

        if (targetUser?.email) {
            await this.email.sendRoleAssigned(
                targetUser.email,
                targetUser.profile?.displayName || targetUser.firstName || 'User',
                roleName,
                description
            );
        }

        return updated;
    }

    /**
     * Get all team members (users with administrative roles)
     * Returns users with roles: super_admin, admin, moderator, support, analytics_viewer
     */
    async getTeamMembers(includeRegularAdmins: boolean = true) {
        const adminRoles = ['super_admin', 'admin', 'moderator', 'support', 'analytics_viewer'];

        const teamMembers = await this.prisma.user.findMany({
            where: {
                OR: [
                    // Users with RBAC roles
                    {
                        userRole: {
                            name: { in: adminRoles }
                        }
                    },
                    // Also include legacy admin users if requested
                    ...(includeRegularAdmins ? [{ role: 'admin' }] : [])
                ]
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
                profile: {
                    select: {
                        displayName: true,
                        avatarUrl: true,
                        lastLoginAt: true,
                    }
                },
                userRole: {
                    select: {
                        id: true,
                        name: true,
                        level: true,
                        description: true,
                    }
                }
            },
            orderBy: [
                { userRole: { level: 'desc' } },
                { createdAt: 'asc' }
            ]
        });

        return teamMembers;
    }

    /**
     * Get permissions available in the system
     */
    async getPermissions() {
        return this.prisma.permission.findMany({
            orderBy: { group: 'asc' }
        });
    }
}

