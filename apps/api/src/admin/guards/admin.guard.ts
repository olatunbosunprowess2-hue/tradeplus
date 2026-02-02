import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ROLE_LEVELS } from '../../common/guards/roles.guard';

/**
 * AdminGuard - Allows access for admin-level roles and above
 * Minimum role required: moderator (level 60)
 * Passes: super_admin, admin, moderator
 * Blocks: support, analytics_viewer, user
 */
@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        console.log('🔐 AdminGuard - User object:', JSON.stringify({
            id: user?.id,
            email: user?.email,
            role: user?.role,
            userRole: user?.userRole,
        }, null, 2));

        if (!user) {
            console.log('❌ AdminGuard - No user in request');
            throw new ForbiddenException('Authentication required');
        }

        // Check legacy role field OR new role system
        const legacyRole = user.role;
        const userRoleName = user.userRole?.name || legacyRole || 'user';
        const userLevel = ROLE_LEVELS[userRoleName] || 0;

        console.log(`🔐 AdminGuard - Role check: legacyRole=${legacyRole}, userRoleName=${userRoleName}, userLevel=${userLevel}`);

        // Minimum level for admin access is moderator (60)
        // This allows super_admin (100), admin (80), and moderator (60)
        const MIN_ADMIN_LEVEL = ROLE_LEVELS.moderator || 60;

        if (userLevel < MIN_ADMIN_LEVEL && legacyRole !== 'admin') {
            console.log(`❌ AdminGuard - Access denied. Level ${userLevel} < ${MIN_ADMIN_LEVEL} and role is not admin`);
            throw new ForbiddenException(
                `Admin access required. Your role: ${userRoleName}`
            );
        }

        console.log('✅ AdminGuard - Access granted');
        return true;
    }
}

