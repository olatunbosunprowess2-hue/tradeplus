import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Role hierarchy levels (higher = more permissions)
 * super_admin: 100 - Full access, can manage other super_admins
 * admin: 80 - Everything except touching super_admin accounts
 * moderator: 60 - Approve/reject ads, ban users, handle reports, view chats
 * support: 40 - Read-only on tickets and chats, can add internal notes
 * analytics_viewer: 20 - Only dashboards and exports
 */
export const ROLE_LEVELS: Record<string, number> = {
    super_admin: 100,
    admin: 80,
    moderator: 60,
    support: 40,
    analytics_viewer: 20,
    user: 0,
};

// Decorator to specify minimum required role
export const RequireRole = (...roles: string[]) => SetMetadata('roles', roles);

// Decorator for specific permissions
export const RequirePermission = (...permissions: string[]) => SetMetadata('permissions', permissions);

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Get required roles from decorator
        const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);

        // Get required permissions from decorator
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles or permissions required, allow access
        if (!requiredRoles?.length && !requiredPermissions?.length) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        // Fetch user with role and permissions
        const fullUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            include: {
                userRole: {
                    include: {
                        permissions: true,
                    },
                },
            },
        });

        if (!fullUser) {
            throw new ForbiddenException('User not found');
        }

        // Check role-based access
        if (requiredRoles?.length) {
            // Use userRole.name if set, otherwise fall back to legacy 'role' field
            // Legacy role='admin' should map to admin level (80)
            let userRoleName = fullUser.userRole?.name;
            if (!userRoleName && fullUser.role === 'admin') {
                userRoleName = 'admin'; // Legacy admin gets admin level
            }
            userRoleName = userRoleName || 'user';

            const userLevel = ROLE_LEVELS[userRoleName] || 0;

            // Find minimum required level from the required roles
            const minRequiredLevel = Math.min(
                ...requiredRoles.map(role => ROLE_LEVELS[role] || 0)
            );

            if (userLevel < minRequiredLevel) {
                throw new ForbiddenException(
                    `Access denied. Required role: ${requiredRoles.join(' or ')}. Your role: ${userRoleName}`
                );
            }
        }

        // Check permission-based access
        if (requiredPermissions?.length) {
            const userPermissions = fullUser.userRole?.permissions?.map(p => p.name) || [];

            const hasAllPermissions = requiredPermissions.every(
                perm => userPermissions.includes(perm)
            );

            if (!hasAllPermissions) {
                throw new ForbiddenException(
                    `Missing required permissions: ${requiredPermissions.join(', ')}`
                );
            }
        }

        // Attach full user with role to request for downstream use
        request.userWithRole = fullUser;

        return true;
    }
}

/**
 * Helper function to check if user can manage target user based on role hierarchy
 */
export function canManageUser(actorRoleName: string, targetRoleName: string): boolean {
    const actorLevel = ROLE_LEVELS[actorRoleName] || 0;
    const targetLevel = ROLE_LEVELS[targetRoleName] || 0;

    // super_admin can manage anyone
    if (actorRoleName === 'super_admin') {
        return true;
    }

    // Others can only manage users with lower role levels
    return actorLevel > targetLevel;
}
