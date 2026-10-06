import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { authService } from '../services/authService';
import '../types';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['*'],
  ORG_ADMIN: ['*'],
  SUPPORT_SUPERVISOR: [
    'tickets:read',
    'tickets:read_all',
    'tickets:create',
    'tickets:update',
    'tickets:assign',
    'tickets:internal_notes',
    'sla:manage',
    'workflows:manage',
    'audit:read',
    'analytics:read',
  ],
  SUPPORT_AGENT: [
    'tickets:read',
    'tickets:read_all',
    'tickets:create',
    'tickets:update',
    'tickets:internal_notes',
  ],
  REQUESTER: [
    'tickets:read',
    'tickets:create',
  ],
};

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Acceso no autenticado. Se requiere token Bearer válido.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyAccessToken(token);

    // Validación multi-tenant: el token debe pertenecer al tenant del contexto
    if (req.tenant && decoded.role !== 'SUPER_ADMIN' && decoded.tenantId !== req.tenant.id) {
      res.status(403).json({
        error: 'CROSS_TENANT_ACCESS_DENIED',
        message: 'El token de usuario no corresponde a la organización activa.',
      });
      return;
    }

    const role = decoded.role as UserRole;
    req.user = {
      id: decoded.userId,
      tenantId: decoded.tenantId,
      email: decoded.email,
      fullName: decoded.fullName,
      role,
      permissions: ROLE_PERMISSIONS[role] || [],
    };

    next();
  } catch {
    res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Token expirado o inválido.',
    });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Usuario no autenticado.' });
      return;
    }

    if (req.user.role === 'SUPER_ADMIN' || roles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({
      error: 'FORBIDDEN_ROLE',
      message: `El rol '${req.user.role}' no tiene autorización para esta operación.`,
    });
  };
}

export function requirePermission(action: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Usuario no autenticado.' });
      return;
    }

    const permissions = req.user.permissions || [];
    const hasPermission =
      permissions.includes('*') ||
      permissions.includes(action) ||
      (action.includes(':') && permissions.includes(`${action.split(':')[0]}:*`));

    if (hasPermission) {
      next();
      return;
    }

    res.status(403).json({
      error: 'INSUFFICIENT_PERMISSIONS',
      message: `Permiso denegado. Se requiere el permiso: '${action}'.`,
    });
  };
}
