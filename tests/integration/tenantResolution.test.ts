import { describe, it, expect, beforeEach } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { tenantContextMiddleware, setTenantFinder } from '../../src/middleware/tenantContext';

describe('Integration: Tenant Resolution Middleware', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock tenant finder for isolated integration tests
    setTenantFinder({
      async findByIdOrSlug(id: string) {
        if (id === 'active-tenant') {
          return {
            id: 'tenant-123',
            slug: 'active-tenant',
            name: 'Active Enterprise Tenant',
            plan: 'ENTERPRISE',
            timezone: 'America/Santiago',
            isActive: true,
          };
        }
        if (id === 'inactive-tenant') {
          return {
            id: 'tenant-999',
            slug: 'inactive-tenant',
            name: 'Suspended Org',
            plan: 'BASIC',
            timezone: 'UTC',
            isActive: false,
          };
        }
        return null;
      },
    });

    app.use(tenantContextMiddleware);
    app.get('/api/test', (req: Request, res: Response) => {
      res.json({ success: true, tenant: req.tenant });
    });
  });

  it('debe retornar 400 si no se incluye la cabecera X-Tenant-ID ni subdominio', async () => {
    const res = await request(app).get('/api/test');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('TENANT_HEADER_MISSING');
  });

  it('debe retornar 404 si el tenant no existe', async () => {
    const res = await request(app)
      .get('/api/test')
      .set('X-Tenant-ID', 'non-existent-tenant');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('TENANT_NOT_FOUND');
  });

  it('debe retornar 403 si el tenant está inactivo o suspendido', async () => {
    const res = await request(app)
      .get('/api/test')
      .set('X-Tenant-ID', 'inactive-tenant');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('TENANT_INACTIVE');
  });

  it('debe resolver exitosamente e inyectar el tenant en req.tenant cuando es válido y activo', async () => {
    const res = await request(app)
      .get('/api/test')
      .set('X-Tenant-ID', 'active-tenant');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tenant.id).toBe('tenant-123');
    expect(res.body.tenant.slug).toBe('active-tenant');
  });
});
