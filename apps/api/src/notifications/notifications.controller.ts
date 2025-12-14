import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    findAll(@Request() req) {
        return this.notificationsService.findAll(req.user.id);
    }

    @Get('unread-count')
    async getUnreadCount(@Request() req) {
        try {
            return await this.notificationsService.getUnreadCount(req.user.id);
        } catch (error) {
            console.error('Error fetching unread count:', error);
            throw error;
        }
    }

    @Patch('read-all')
    markAllAsRead(@Request() req) {
        return this.notificationsService.markAllAsRead(req.user.id);
    }

    @Patch(':id/read')
    markAsRead(@Request() req, @Param('id') id: string) {
        return this.notificationsService.markAsRead(req.user.id, id);
    }
}
