import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { ActivityService } from './activity.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'activity',
})
export class ActivityGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger = new Logger('ActivityGateway');

    constructor(
        @Inject(forwardRef(() => ActivityService))
        private activityService: ActivityService
    ) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);

        // Setup room joining
        client.on('join', (userId: string) => {
            if (userId) {
                client.join(`user:${userId}`);
                this.logger.log(`Client ${client.id} joined room: user:${userId}`);

                // Immediately update status on join
                this.activityService.updateLastActive(userId).catch(() => { });
            }
        });
    }

    @SubscribeMessage('heartbeat')
    async handleHeartbeat(
        @MessageBody() data: { userId: string },
        @ConnectedSocket() client: Socket,
    ) {
        if (data.userId) {
            await this.activityService.updateLastActive(data.userId);
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    broadcast(event: string, data: any) {
        this.server.emit(event, data);
    }

    sendToUser(userId: string, event: string, data: any) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
}

