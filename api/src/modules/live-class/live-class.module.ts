import { Module } from '@nestjs/common'
import { LiveClassService } from './live-class.service'
import { LiveClassController } from './live-class.controller'

@Module({
  controllers: [LiveClassController],
  providers: [LiveClassService],
  exports: [LiveClassService],
})
export class LiveClassModule {}
