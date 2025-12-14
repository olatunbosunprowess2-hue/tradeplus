import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin/security')
// @UseGuards(JwtAuthGuard) // Ensure only admins can access
export class SecurityController {
    constructor(private readonly securityService: SecurityService) { }

    @Get('suspicious-ips')
    async getSuspiciousIps() {
        return this.securityService.getSuspiciousIps();
    }

    @Post('block-ip')
    async blockIp(@Body() body: { ip: string, reason: string }) {
        return this.securityService.blockIp(body.ip, body.reason);
    }
}
