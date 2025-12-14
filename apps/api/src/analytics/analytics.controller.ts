import { Controller, Get, UseGuards, Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, RequireRole } from '../common/guards/roles.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    /**
     * Get KPI metrics (new users, ads, chats, reports)
     * Accessible by: analytics_viewer+
     */
    @Get('kpi')
    @RequireRole('analytics_viewer')
    async getKPIs() {
        return this.analyticsService.getKPIs();
    }

    /**
     * Get top categories by ad count and views
     * Accessible by: analytics_viewer+
     */
    @Get('categories')
    @RequireRole('analytics_viewer')
    async getCategories() {
        return this.analyticsService.getTopCategories();
    }

    /**
     * Get hot listings (by views + chat activity)
     * Accessible by: analytics_viewer+
     */
    @Get('hot')
    @RequireRole('analytics_viewer')
    async getHotListings() {
        return this.analyticsService.getHotListings();
    }

    /**
     * Get spam and abuse statistics
     * Accessible by: moderator+
     */
    @Get('spam')
    @RequireRole('moderator')
    async getSpamStats() {
        return this.analyticsService.getSpamStats();
    }

    /**
     * Export analytics data as CSV
     * type: 'kpis' | 'categories' | 'hot' | 'spam'
     * Accessible by: analytics_viewer+
     */
    @Get('export/csv')
    @RequireRole('analytics_viewer')
    async exportCSV(@Query('type') type: string, @Res() res: Response) {
        let data: any[];
        let filename: string;
        let headers: string[];

        switch (type) {
            case 'categories':
                data = await this.analyticsService.getTopCategories();
                headers = ['Category', 'Ads Count', 'Views'];
                filename = 'categories_report.csv';
                break;
            case 'hot':
                data = await this.analyticsService.getHotListings();
                headers = ['ID', 'Title', 'Views', 'Chats', 'Score'];
                filename = 'hot_listings_report.csv';
                break;
            case 'kpis':
            default:
                const kpis = await this.analyticsService.getKPIs();
                data = [
                    { metric: 'New Users Today', value: kpis.users.current, delta: kpis.users.delta + '%' },
                    { metric: 'New Ads Today', value: kpis.ads.current, delta: kpis.ads.delta + '%' },
                    { metric: 'Chats Today', value: kpis.chats.current, delta: kpis.chats.delta + '%' },
                    { metric: 'Reports Today', value: kpis.reports.current, delta: kpis.reports.delta + '%' }
                ];
                headers = ['Metric', 'Value', 'Change'];
                filename = 'kpi_report.csv';
        }

        // Generate CSV content
        const csvRows = [headers.join(',')];
        data.forEach(row => {
            const values = Object.values(row).map(v =>
                typeof v === 'string' && v.includes(',') ? `"${v}"` : v
            );
            csvRows.push(values.join(','));
        });
        const csvContent = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);
    }
}

