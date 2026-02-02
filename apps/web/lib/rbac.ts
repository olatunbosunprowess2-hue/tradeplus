import { User } from './types';

export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'support' | 'analytics_viewer' | 'user';

// Role Hierarchy Levels (matches backend)
export const ROLE_LEVELS: Record<string, number> = {
    super_admin: 100,
    admin: 80,
    moderator: 60,
    support: 40,
    analytics_viewer: 20,
    user: 0,
};

export const PERMISSIONS = {
    VIEW_DASHBOARD: 20,    // All staff
    VIEW_ANALYTICS: 20,    // analytics_viewer+
    VIEW_USERS: 40,        // support+
    VIEW_REPORTS: 40,      // support+
    VIEW_APPEALS: 40,      // support+
    VIEW_DISPUTES: 40,     // support+
    VIEW_LISTINGS: 40,     // support+
    VIEW_REVIEWS: 40,      // support+

    // Action Permissions
    MANAGE_USERS: 60,      // moderator+ (Ban/Unban)
    RESOLVE_REPORTS: 60,   // moderator+
    RESOLVE_DISPUTES: 60,  // moderator+

    // Admin Only
    VIEW_SECURITY: 80,     // admin+
    MANAGE_TEAM: 80,       // admin+
    DELETE_ANYTHING: 80,   // admin+
};

/**
 * Checks if a user has at least the specified role level
 */
export function hasRoleLevel(user: User | null, requiredLevel: number): boolean {
    if (!user) return false;

    // Prioritize new userRole object, fall back to legacy 'role' field
    const userRole = (user as any).userRole?.name || user.role || 'user';
    const userLevel = ROLE_LEVELS[userRole] || 0;

    return userLevel >= requiredLevel;
}

/**
 * Checks if user is allowed to access the admin panel at all
 */
export function canAccessAdminPanel(user: User | null): boolean {
    return hasRoleLevel(user, ROLE_LEVELS.analytics_viewer);
}

/**
 * Checks if user can perform specific actions
 */
export function canManageUsers(user: User | null): boolean {
    return hasRoleLevel(user, PERMISSIONS.MANAGE_USERS);
}

export function canViewSecurity(user: User | null): boolean {
    return hasRoleLevel(user, PERMISSIONS.VIEW_SECURITY);
}

export function canManageTeam(user: User | null): boolean {
    return hasRoleLevel(user, PERMISSIONS.MANAGE_TEAM);
}
