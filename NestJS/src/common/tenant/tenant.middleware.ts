import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from './tenant.context';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let tenantId = 'default';

    // 1. Extraer de headers personalizados
    const headerTenant = req.headers['x-tenant-id'] || req.headers['x-center-id'];
    if (headerTenant && typeof headerTenant === 'string' && headerTenant.trim()) {
      tenantId = headerTenant.trim();
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // 2. Extraer del JWT Token si contiene información de centro
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.decode(token) as any;
        if (decoded && (decoded.centroId || decoded.centroSlug || decoded.centro)) {
          tenantId = decoded.centroId || decoded.centroSlug || decoded.centro;
        }
      } catch (_) {
        // Si falla la lectura del token, continuar con el fallback por defecto
      }
    } else if (req.query && typeof req.query.tenantId === 'string' && req.query.tenantId.trim()) {
      // 3. Extraer de parámetro query URL
      tenantId = req.query.tenantId.trim();
    }

    // Ejecutar la petición dentro del contexto del tenant resuelto
    TenantContext.run({ tenantId }, () => {
      next();
    });
  }
}
