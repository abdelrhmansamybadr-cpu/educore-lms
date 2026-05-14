import { Module } from '@nestjs/common'
import { StudentAffairsService } from './student-affairs.service'
import { StudentAffairsController } from './student-affairs.controller'

@Module({
  controllers: [StudentAffairsController],
  providers: [StudentAffairsService],
})
export class StudentAffairsModule {}
