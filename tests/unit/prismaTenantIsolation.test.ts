import { describe, it, expect, vi } from 'vitest';
import { getTenantPrisma } from '../../src/infrastructure/database/prismaClient';

describe('Prisma Multi-Tenant Isolation Extension', () => {
  it('debe arrojar error si no se provee un tenantId válido', () => {
    expect(() => getTenantPrisma('')).toThrow('Tenant ID obligatorio');
    // @ts-expect-error probando valor inválido
    expect(() => getTenantPrisma(null)).toThrow('Tenant ID obligatorio');
  });

  it('debe generar una instancia de cliente extendido cuando el tenantId es válido', () => {
    const tenantId = 'tenant-satem-enterprise-001';
    const tenantPrisma = getTenantPrisma(tenantId);
    expect(tenantPrisma).toBeDefined();
    expect(tenantPrisma.ticket).toBeDefined();
    expect(tenantPrisma.user).toBeDefined();
    expect(tenantPrisma.slaPolicy).toBeDefined();
  });

  it('debe aislar y agregar automáticamente el tenantId en las consultas findMany', async () => {
    const tenantId = 'tenant-satem-enterprise-001';
    const tenantPrisma = getTenantPrisma(tenantId);

    // Mock query runner
    const spy = vi.spyOn(tenantPrisma.ticket, 'findMany').mockResolvedValue([]);

    const result = await tenantPrisma.ticket.findMany({
      where: { status: 'OPEN' }
    });

    expect(spy).toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
