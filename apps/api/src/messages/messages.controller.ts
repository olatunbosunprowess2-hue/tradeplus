import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../common/configs/multer.config';
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

    @Get('conversation/with/:participantId')
    getConversationByParticipant(@Request() req, @Param('participantId') participantId: string) {
        return this.messagesService.getConversationByParticipant(req.user.id, participantId);
    }

    @Get(':conversationId')
    getMessages(@Request() req, @Param('conversationId') conversationId: string) {
        return this.messagesService.getMessages(conversationId, req.user.id);
    }

    @Post()
    @UseInterceptors(FileInterceptor('file', multerConfig))
    async sendMessage(
        @Request() req,
        @Body() body: { receiverId: string; content: string; listingId?: string },
        @UploadedFile() file: Express.Multer.File
    ) {
        return this.messagesService.sendMessage(req.user.id, body, file);
    }

    @Post('start')
    startConversation(@Request() req, @Body() body: { participantId: string; listingId?: string; initialMessage?: string }) {
        return this.messagesService.startConversation(req.user.id, body.participantId, body.listingId, body.initialMessage);
    }

    @Patch(':conversationId/read')
    markAsRead(@Request() req, @Param('conversationId') conversationId: string) {
        return this.messagesService.markAsRead(conversationId, req.user.id);
    }
}
