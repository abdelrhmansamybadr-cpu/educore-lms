import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { MessagingService } from './messaging.service'

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  namespace: 'messaging',
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server
  private readonly logger = new Logger(MessagingGateway.name)
  private userSockets = new Map<string, string>()

  constructor(
    private jwt: JwtService,
    private messaging: MessagingService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1]
      if (!token) { client.disconnect(); return }

      const payload = this.jwt.verify(token)
      const userId = payload.sub
      this.userSockets.set(userId, client.id)
      client.data.userId = userId
      client.join(`user:${userId}`)
      this.logger.log(`User ${userId} connected`)
    } catch {
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId
    if (userId) {
      this.userSockets.delete(userId)
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string; contentType?: string; fileUrl?: string },
  ) {
    const senderId = client.data.userId
    const message = await this.messaging.sendMessage(
      senderId, data.conversationId, data.content, data.contentType, data.fileUrl,
    )

    // Emit to all participants in the conversation room
    this.server.to(`conv:${data.conversationId}`).emit('new_message', message)
    return message
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.join(`conv:${data.conversationId}`)
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(`conv:${data.conversationId}`).emit('user_typing', { userId: client.data.userId })
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(`conv:${data.conversationId}`).emit('user_stop_typing', { userId: client.data.userId })
  }

  sendNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification)
  }

  broadcastAnnouncement(schoolId: string, announcement: any) {
    this.server.to(`school:${schoolId}`).emit('new_announcement', announcement)
  }
}
