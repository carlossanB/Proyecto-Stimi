import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable() // Guard(protector) que se puede usar en toda la aplicación
export class RolesGuard implements CanActivate { // implementa CanActivate
  constructor(private reflector: Reflector) {} // reflector es una instancia de Reflector

  canActivate(context: ExecutionContext): boolean { // permite o deniega el acceso
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.rol) {
      throw new ForbiddenException('Acceso denegado: rol no definido');
    }
    
    const hasRole = requiredRoles.some((role) => user.rol.toLowerCase() === role.toLowerCase());
    if (!hasRole) {
      throw new ForbiddenException('Acceso denegado: no cuenta con los permisos necesarios');
    }
    return true;
  }
}
