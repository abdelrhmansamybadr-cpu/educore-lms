import { Module } from '@nestjs/common'
import { ReceptionistService } from './receptionist.service'
import { ReceptionistController } from './receptionist.controller'

@Module({
  controllers: [ReceptionistController],
  providers: [ReceptionistService],
  exports: [ReceptionistService],
})
export class ReceptionistModule {}
