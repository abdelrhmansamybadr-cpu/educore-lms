import { Module } from '@nestjs/common'
import { ItController } from './it.controller'
import { ItService } from './it.service'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [ItController],
  providers: [ItService],
})
export class ItModule {}
