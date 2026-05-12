import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MessagingService } from './messaging.service'
import { MessagingController } from './messaging.controller'
import { MessagingGateway } from './messaging.gateway'

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_ACCESS_SECRET'),
      }),
    }),
  ],
  controllers: [MessagingController],
  providers: [MessagingService, MessagingGateway],
  exports: [MessagingService, MessagingGateway],
})
export class MessagingModule {}
