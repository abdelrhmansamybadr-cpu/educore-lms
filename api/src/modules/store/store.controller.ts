import {
  Controller, Get, Post, Patch, Body, Param, Query,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { StoreService } from './store.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'

@ApiTags('Store')
@ApiBearerAuth()
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('stats')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER, Role.IT_ADMIN)
  @ApiOperation({ summary: 'Store inventory stats' })
  getStats(@CurrentUser('schoolId') schoolId: string) {
    return this.storeService.getStats(schoolId)
  }

  @Get('items')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER, Role.IT_ADMIN, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'List all inventory items' })
  getItems(
    @CurrentUser('schoolId') schoolId: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.storeService.getItems(schoolId, { category, search, lowStock: lowStock === 'true' })
  }

  @Get('items/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER, Role.IT_ADMIN)
  @ApiOperation({ summary: 'Get item details with movement history' })
  getItem(@CurrentUser('schoolId') schoolId: string, @Param('id') id: string) {
    return this.storeService.getItemById(schoolId, id)
  }

  @Post('items')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER)
  @ApiOperation({ summary: 'Create inventory item' })
  createItem(@CurrentUser('schoolId') schoolId: string, @Body() body: any) {
    return this.storeService.createItem(schoolId, body)
  }

  @Patch('items/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER)
  @ApiOperation({ summary: 'Update inventory item' })
  updateItem(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.storeService.updateItem(schoolId, id, body)
  }

  @Post('items/:id/adjust')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER)
  @ApiOperation({ summary: 'Adjust stock (IN / OUT / ADJUSTMENT)' })
  adjustStock(
    @CurrentUser('schoolId') schoolId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { type: 'IN' | 'OUT' | 'ADJUSTMENT'; quantity: number; reason?: string },
  ) {
    return this.storeService.adjustStock(schoolId, id, userId, body.type, body.quantity, body.reason)
  }

  @Get('movements')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER)
  @ApiOperation({ summary: 'Stock movement history' })
  getMovements(
    @CurrentUser('schoolId') schoolId: string,
    @Query('itemId') itemId?: string,
  ) {
    return this.storeService.getMovements(schoolId, itemId)
  }
}
