import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Get('conversations')
    getConversations(@Request() req) {
        return this.messagesService.getConversations(req.user.id);
    }

    @Get(':conversationId')
    getMessages(@Request() req, @Param('conversationId') conversationId: string) {
        return this.messagesService.getMessages(conversationId, req.user.id);
    }

    @Post()
    sendMessage(@Request() req, @Body() body: { receiverId: string; content: string; listingId?: string }) {
        return this.messagesService.sendMessage(req.user.id, body);
    }

    @Patch(':conversationId/read')
    markAsRead(@Request() req, @Param('conversationId') conversationId: string) {
        return this.messagesService.markAsRead(conversationId, req.user.id);
    }
}
