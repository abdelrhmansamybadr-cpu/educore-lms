import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PrismaService } from '../../prisma/prisma.service'

export const REQUIRE_MODULE_KEY = 'requireModule'

export const RequireModule = (moduleName: string) =>
  Reflect.metadata(REQUIRE_MODULE_KEY, moduleName)

@Injectable()
export class SchoolModuleGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const moduleName = this.reflector.getAllAndOverride<string>(REQUIRE_MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!moduleName) return true

    const { user } = context.switchToHttp().getRequest()
    if (!user?.schoolId) return true // super admin bypass

    const config = await this.prisma.schoolModuleConfig.findUnique({
      where: { schoolId_module: { schoolId: user.schoolId, module: moduleName } },
    })

    if (config && !config.enabled) {
      throw new ForbiddenException(`Module '${moduleName}' is not enabled for this school`)
    }

    return true
  }
}
