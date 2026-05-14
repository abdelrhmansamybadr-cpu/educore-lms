import { createParamDecorator, ExecutionContext } from '@nestjs/common'

// Extracts schoolId: prefers explicit x-school-id header (school picker) over JWT claim.
// This allows org-level roles (HR_MANAGER, FINANCE_MANAGER, etc.) to switch context via the school picker.
// School-level users without a picker never send the header, so JWT schoolId is used as fallback.
export const SchoolId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest()
  return request.headers['x-school-id'] ?? request.user?.schoolId ?? null
})
