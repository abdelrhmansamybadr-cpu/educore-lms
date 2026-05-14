import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'

// Human-readable field name from Prisma's meta target
function fieldFromTarget(target: Prisma.PrismaClientKnownRequestError['meta']): string {
  if (!target) return 'field'
  const t = (target as any).target ?? (target as any).field_name ?? ''
  if (Array.isArray(t)) return t.join(', ')
  return String(t) || 'field'
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let errors: any = null

    // ── NestJS HTTP exceptions (BadRequest, Conflict, etc.) ───────────────────
    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()
      if (typeof res === 'string') {
        message = res
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || message
        errors = (res as any).errors || null
      }

    // ── Prisma known request errors ───────────────────────────────────────────
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const code = exception.code

      if (code === 'P2002') {
        // Unique constraint violation
        status = HttpStatus.CONFLICT
        const field = fieldFromTarget(exception.meta)
        message = `A record with this ${field} already exists`

      } else if (code === 'P2025') {
        // Record not found
        status = HttpStatus.NOT_FOUND
        message = (exception.meta as any)?.cause ?? 'Record not found'

      } else if (code === 'P2003') {
        // Foreign key constraint failed
        status = HttpStatus.BAD_REQUEST
        message = 'Referenced record does not exist'

      } else if (code === 'P2014') {
        // Required relation violation
        status = HttpStatus.BAD_REQUEST
        message = 'Required relation is missing'

      } else {
        // Other Prisma errors — log them but return 400 instead of 500
        status = HttpStatus.BAD_REQUEST
        message = `Database error (${code})`
        this.logger.error(`Prisma ${code}`, exception.message)
      }

    // ── Prisma validation errors ──────────────────────────────────────────────
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST
      // Extract meaningful info: find the field name and bad value from the message
      const raw = exception.message
      const unknownEnumMatch = raw.match(/Got invalid value '([^']+)' on the field '?(\w+)'?/)
      const missingFieldMatch = raw.match(/Argument `(\w+)` is missing/)
      const invalidTypeMatch = raw.match(/Argument `(\w+)`: Invalid value provided/)
      if (unknownEnumMatch) {
        message = `"${unknownEnumMatch[1]}" is not a valid value for ${unknownEnumMatch[2]}. Please choose from the available options.`
      } else if (missingFieldMatch) {
        message = `Required field "${missingFieldMatch[1]}" is missing. Please fill in all required fields.`
      } else if (invalidTypeMatch) {
        message = `Invalid value provided for field "${invalidTypeMatch[1]}". Please check the format and try again.`
      } else {
        message = 'Some data you entered is invalid. Please check your inputs and try again.'
      }
      this.logger.error('Prisma validation error', raw)

    // ── Unknown / unexpected errors ───────────────────────────────────────────
    } else {
      this.logger.error('Unhandled exception', exception)
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    })
  }
}
