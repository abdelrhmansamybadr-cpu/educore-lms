import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { ParentService } from './parent.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'

@ApiTags('parent')
@ApiBearerAuth()
@Controller('parent')
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @Get('children')
  @Roles('PARENT')
  getChildren(@CurrentUser('id') parentId: string) {
    return this.parentService.getChildren(parentId)
  }

  @Get('invoices')
  @Roles('PARENT')
  getInvoices(@CurrentUser('id') parentId: string) {
    return this.parentService.getChildrenInvoices(parentId)
  }

  @Get('children/:studentId')
  @Roles('PARENT')
  getChildDetails(
    @CurrentUser('id') parentId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.parentService.getChildDetails(parentId, studentId)
  }
}
