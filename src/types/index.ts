import { Tenant, UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions?: string[];
}

export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  plan: string;
  timezone: string;
  isActive: boolean;
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      user?: AuthenticatedUser;
    }
  }
}
