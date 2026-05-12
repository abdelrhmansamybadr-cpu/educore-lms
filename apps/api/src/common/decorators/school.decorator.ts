import { createParamDecorator, ExecutionContext } from '@nestjs/common'

// Extracts schoolId from the authenticated user
export const SchoolId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest()
  return request.user?.schoolId
})
