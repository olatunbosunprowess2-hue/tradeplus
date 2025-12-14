import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, RequireRole } from '../common/guards/roles.guard';

@Controller('activity')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityController {
    constructor(private readonly activityService: ActivityService) { }

    /**
     * Get basic dashboard stats (in-memory stats + feed)
     * Accessible by: moderator+
     */
    @Get('dashboard')
    @RequireRole('moderator')
    getDashboardData() {
        return this.activityService.getDashboardStats();
    }

    /**
     * Get comprehensive activity statistics
     * Ads posted today/7d/30d, active chats, reports
     * Accessible by: analytics_viewer+
     */
    @Get('stats')
    @RequireRole('analytics_viewer')
    async getActivityStats() {
        return this.activityService.getActivityStats();
    }

    /**
     * Get top 10 most active users in last 24 hours
     * Accessible by: moderator+
     */
    @Get('top-users')
    @RequireRole('moderator')
    async getTopActiveUsers(@Query('hours') hours?: string) {
        return this.activityService.getTopActiveUsers(hours ? parseInt(hours) : 24);
    }

    /**
     * Get live activity feed (last N actions)
     * Accessible by: moderator+
     */
    @Get('feed')
    @RequireRole('moderator')
    async getLiveActivityFeed(@Query('limit') limit?: string) {
        return this.activityService.getLiveActivityFeed(limit ? parseInt(limit) : 20);
    }

    /**
     * Get recent login IPs with suspicious warnings
     * Accessible by: admin+
     */
    @Get('login-ips')
    @RequireRole('admin')
    async getRecentLoginIps(@Query('limit') limit?: string) {
        return this.activityService.getRecentLoginIps(limit ? parseInt(limit) : 50);
    }
}

