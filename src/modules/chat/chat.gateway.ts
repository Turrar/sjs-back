import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { ChatService } from './chat.service';

type SocketData = { userId?: string };
type AuthedSocket = Socket & { data: SocketData };

function resolveChatCorsOrigin(): string | string[] | boolean {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (raw) {
    const origins = raw.split(',').map((s) => s.trim()).filter(Boolean);
    return origins.length === 1 ? origins[0]! : origins;
  }
  return process.env.NODE_ENV === 'production' ? false : '*';
}

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: resolveChatCorsOrigin() },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly log = new Logger(ChatGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly chat: ChatService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (typeof client.handshake.query?.token === 'string'
        ? client.handshake.query.token
        : undefined);
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      const sockData = client.data as SocketData;
      sockData.userId = payload.sub;
    } catch (e) {
      this.log.warn(`WS auth failed: ${e}`);
      client.disconnect();
    }
  }

  @SubscribeMessage('join')
  async join(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() applicationId: string,
  ) {
    const data = client.data as SocketData;
    const userId = data.userId;
    if (!userId || typeof applicationId !== 'string') {
      return { error: 'invalid' };
    }
    try {
      await this.chat.assertCanAccessApplication(applicationId, userId);
      await client.join(`app:${applicationId}`);
      return { ok: true };
    } catch {
      return { error: 'forbidden' };
    }
  }

  @SubscribeMessage('send')
  async send(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody()
    payload: { applicationId: string; body: string },
  ) {
    const data = client.data as SocketData;
    const userId = data.userId;
    if (!userId || !payload?.applicationId || !payload?.body) {
      return { error: 'invalid' };
    }
    try {
      const msg = await this.chat.createMessage(
        userId,
        payload.applicationId,
        payload.body,
      );
      this.server.to(`app:${payload.applicationId}`).emit('message', msg);
      return msg;
    } catch {
      return { error: 'failed' };
    }
  }
}
