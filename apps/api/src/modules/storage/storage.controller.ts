import { Controller, Post, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { StorageService } from './storage.service'

@ApiTags('Storage')
@ApiBearerAuth()
@Controller('storage')
export class StorageController {
  constructor(private storage: StorageService) {}

  @Post('presigned-url')
  @ApiOperation({ summary: 'Get presigned URL for direct browser upload to S3' })
  getPresignedUrl(
    @Body() body: { folder: string; filename: string; contentType: string },
  ) {
    return this.storage.getPresignedUrl(body.folder, body.filename, body.contentType)
  }
}
