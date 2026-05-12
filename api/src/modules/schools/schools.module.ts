import { Module } from '@nestjs/common'
import { SchoolsController } from './schools.controller'
import { SchoolsService } from './schools.service'
import { StorageModule } from '../storage/storage.module'

@Module({
  imports: [StorageModule],
  controllers: [SchoolsController],
  providers: [SchoolsService],
  exports: [SchoolsService],
})
export class SchoolsModule {}
