import { Request, Response, NextFunction } from 'express';
import { prisma } from '../infrastructure/database/prismaClient';
import '../types';

export interface TenantFinder {
  findByIdOrSlug(identifier: string): Promise<{
    id: string;
    slug: string;
    name: string;
    plan: string;
    timezone: string;
    isActive: boolean;
  } | null>;
}

export class DefaultTenantFinder implements TenantFinder {
  async findByIdOrSlug(identifier: string) {
    return prisma.tenant.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier },
          { subdomain: identifier },
        ],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        plan: true,
        timezone: true,
        isActive: true,
      },
    });
  }
}

let tenantFinderInstance: TenantFinder = new DefaultTenantFinder();

export function setTenantFinder(finder: TenantFinder) {
  tenantFinderInstance = finder;
}

export async function tenantContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Obtener identificador desde cabeceras
    const headerTenant = req.headers['x-tenant-id'] || req.headers['x-tenant-slug'];
    let identifier: string | undefined = Array.isArray(headerTenant)
      ? headerTenant[0]
      : (headerTenant as string | undefined);

    // 2. Si no viene en cabecera, extraer del subdominio del host
    if (!identifier && req.hostname) {
      const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(req.hostname);
      if (!isIp && req.hostname !== 'localhost') {
        const parts = req.hostname.split('.');
        if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'api') {
          identifier = parts[0];
        }
      }
    }

    if (!identifier) {
      res.status(400).json({
        error: 'TENANT_HEADER_MISSING',
        message: 'La solicitud requiere la cabecera X-Tenant-ID o un subdominio válido.',
      });
      return;
    }

    // 3. Buscar tenant
    const tenant = await tenantFinderInstance.findByIdOrSlug(identifier);

    if (!tenant) {
      res.status(404).json({
        error: 'TENANT_NOT_FOUND',
        message: `El inquilino especificado '${identifier}' no existe.`,
      });
      return;
    }

    if (!tenant.isActive) {
      res.status(403).json({
        error: 'TENANT_INACTIVE',
        message: 'La suscripción u operación del inquilino se encuentra inactiva.',
      });
      return;
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
}
