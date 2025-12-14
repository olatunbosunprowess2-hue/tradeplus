import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
    constructor(private prisma: PrismaService) { }

    /**
     * Basic health check - always returns OK if server is running
     * Use for: Load balancer health checks, uptime monitors
     * GET /api/health
     */
    @Get()
    async health() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
        };
    }

    /**
     * Readiness check - checks if all dependencies are ready
     * Use for: Kubernetes readiness probes, deployment checks
     * GET /api/health/ready
     */
    @Get('ready')
    async ready() {
        const checks: Record<string, boolean> = {};
        let isReady = true;

        // Check database connection
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            checks.database = true;
        } catch {
            checks.database = false;
            isReady = false;
        }

        return {
            status: isReady ? 'ready' : 'not_ready',
            timestamp: new Date().toISOString(),
            checks,
        };
    }

    /**
     * Detailed system info (only in development)
     * GET /api/health/info
     */
    @Get('info')
    async info() {
        if (process.env.NODE_ENV === 'production') {
            return { message: 'Not available in production' };
        }

        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            node: process.version,
            platform: process.platform,
            arch: process.arch,
        };
    }
}
