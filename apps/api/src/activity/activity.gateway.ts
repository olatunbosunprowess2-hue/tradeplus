import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
// import { WsJwtGuard } from '../auth/guards/ws-jwt.guard'; // TODO: Implement WS Auth

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

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);

        // Setup room joining
        client.on('join', (userId: string) => {
            if (userId) {
                client.join(`user:${userId}`);
                this.logger.log(`Client ${client.id} joined room: user:${userId}`);
            }
        });
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

