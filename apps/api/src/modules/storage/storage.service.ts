import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp')
import { v4 as uuid } from 'uuid'
import * as path from 'path'

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private s3: S3Client
  private bucket: string
  private cdnUrl: string

  constructor(private config: ConfigService) {
    this.s3 = new S3Client({
      region: config.get<string>('AWS_REGION') || 'me-south-1',
      credentials: {
        accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    })
    this.bucket = config.get<string>('AWS_S3_BUCKET') || 'educore-uploads'
    this.cdnUrl = config.get<string>('AWS_CLOUDFRONT_URL') || `https://${this.bucket}.s3.amazonaws.com`
  }

  // ── Upload file ───────────────────────────────────────────────────────────────

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    options: { resize?: { width: number; height: number }; quality?: number } = {},
  ): Promise<string> {
    let buffer = file.buffer
    const ext = path.extname(file.originalname).toLowerCase()
    const key = `${folder}/${uuid()}${ext}`

    // Optimize images
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      const sharpInstance = sharp(buffer).webp({ quality: options.quality || 85 })
      if (options.resize) sharpInstance.resize(options.resize.width, options.resize.height, { fit: 'cover' })
      buffer = await sharpInstance.toBuffer()
    }

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: file.mimetype,
        CacheControl: 'max-age=31536000',
      }),
    )

    return `${this.cdnUrl}/${key}`
  }

  // ── Delete file ───────────────────────────────────────────────────────────────

  async deleteFile(url: string): Promise<void> {
    const key = url.replace(`${this.cdnUrl}/`, '')
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
    } catch (err) {
      this.logger.warn(`Failed to delete file: ${key}`, err)
    }
  }

  // ── Presigned URL (for direct browser upload) ─────────────────────────────────

  async getPresignedUrl(folder: string, filename: string, contentType: string) {
    const ext = path.extname(filename)
    const key = `${folder}/${uuid()}${ext}`
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    })
    const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 })
    return { uploadUrl: url, fileUrl: `${this.cdnUrl}/${key}`, key }
  }
}
