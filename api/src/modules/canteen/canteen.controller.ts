import {
  Controller, Get, Post, Patch, Body, Param, Query,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { CanteenService } from './canteen.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'

@ApiTags('Canteen')
@ApiBearerAuth()
@Controller('canteen')
export class CanteenController {
  constructor(private readonly canteenService: CanteenService) {}

  @Get('stats')
  @Roles(Role.SCHOOL_ADMIN, Role.CANTEEN_MANAGER)
  @ApiOperation({ summary: 'Canteen dashboard stats' })
  getStats(@CurrentUser('schoolId') schoolId: string) {
    return this.canteenService.getStats(schoolId)
  }

  @Get('menu')
  @ApiOperation({ summary: 'Get available menu items' })
  getMenu(
    @CurrentUser('schoolId') schoolId: string,
    @Query('category') category?: string,
  ) {
    return this.canteenService.getMenu(schoolId, category)
  }

  @Get('items')
  @Roles(Role.SCHOOL_ADMIN, Role.CANTEEN_MANAGER)
  @ApiOperation({ summary: 'Get all menu items (admin)' })
  getAllItems(@CurrentUser('schoolId') schoolId: string) {
    return this.canteenService.getAllItems(schoolId)
  }

  @Post('items')
  @Roles(Role.SCHOOL_ADMIN, Role.CANTEEN_MANAGER)
  @ApiOperation({ summary: 'Create a menu item' })
  createItem(@CurrentUser('schoolId') schoolId: string, @Body() body: any) {
    return this.canteenService.createItem(schoolId, body)
  }

  @Patch('items/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.CANTEEN_MANAGER)
  @ApiOperation({ summary: 'Update a menu item' })
  updateItem(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.canteenService.updateItem(schoolId, id, body)
  }

  @Patch('items/:id/toggle')
  @Roles(Role.SCHOOL_ADMIN, Role.CANTEEN_MANAGER)
  @ApiOperation({ summary: 'Toggle item availability' })
  toggleAvailability(@CurrentUser('schoolId') schoolId: string, @Param('id') id: string) {
    return this.canteenService.toggleAvailability(schoolId, id)
  }

  @Post('orders')
  @ApiOperation({ summary: 'Place a canteen order' })
  placeOrder(
    @CurrentUser('id') userId: string,
    @CurrentUser('schoolId') schoolId: string,
    @Body() body: { items: { itemId: string; quantity: number }[]; note?: string },
  ) {
    return this.canteenService.placeOrder(userId, schoolId, body.items, body.note)
  }

  @Get('orders')
  @Roles(Role.SCHOOL_ADMIN, Role.CANTEEN_MANAGER)
  @ApiOperation({ summary: 'List all orders (admin)' })
  getOrders(
    @CurrentUser('schoolId') schoolId: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('date') date?: string,
  ) {
    return this.canteenService.getOrders(schoolId, { status, userId, date })
  }

  @Get('orders/my')
  @ApiOperation({ summary: 'Get my orders' })
  getMyOrders(@CurrentUser('id') userId: string) {
    return this.canteenService.getMyOrders(userId)
  }

  @Patch('orders/:id/status')
  @Roles(Role.SCHOOL_ADMIN, Role.CANTEEN_MANAGER)
  @ApiOperation({ summary: 'Update order status' })
  updateOrderStatus(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.canteenService.updateOrderStatus(schoolId, id, status)
  }
}
