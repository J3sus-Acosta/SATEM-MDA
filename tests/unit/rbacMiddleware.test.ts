import { describe, it, expect, vi } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { requireAuth, requirePermission, requireRole } from '../../src/middleware/rbacMiddleware';
import { authService } from '../../src/services/authService';

describe('Unit: RBAC & Permissions Middleware', () => {
  function createTestApp() {
    const app = express();
    app.use(express.json());

    // Context mock
    app.use((req, res, next) => {
      req.tenant = {
        id: 'tenant-001',
        slug: 'satem',
        name: 'SATEM',
        plan: 'ENTERPRISE',
        timezone: 'America/Santiago',
        isActive: true,
      };
      next();
    });

    app.get('/protected-sla', requireAuth, requirePermission('sla:manage'), (req: Request, res: Response) => {
      res.json({ success: true, message: 'SLA config access granted' });
    });

    app.get('/protected-admin-only', requireAuth, requireRole('ORG_ADMIN'), (req: Request, res: Response) => {
      res.json({ success: true, message: 'Admin role granted' });
    });

    return app;
  }

  it('debe retornar 401 si no se envía encabezado de autorización', async () => {
    const app = createTestApp();
    const res = await request(app).get('/protected-sla');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('UNAUTHORIZED');
  });

  it('debe denegar con 403 si el rol del usuario no tiene el permiso requerido', async () => {
    const app = createTestApp();

    vi.spyOn(authService, 'verifyAccessToken').mockReturnValue({
      userId: 'req-01',
      tenantId: 'tenant-001',
      email: 'requester@client.cl',
      role: 'REQUESTER',
      fullName: 'Cliente Solicitante',
    });

    const res = await request(app)
      .get('/protected-sla')
      .set('Authorization', 'Bearer valid-requester-token');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('INSUFFICIENT_PERMISSIONS');
  });

  it('debe permitir el acceso si el rol del usuario cuenta con el permiso solicitado', async () => {
    const app = createTestApp();

    vi.spyOn(authService, 'verifyAccessToken').mockReturnValue({
      userId: 'sup-01',
      tenantId: 'tenant-001',
      email: 'supervisor@satem.cl',
      role: 'SUPPORT_SUPERVISOR',
      fullName: 'Supervisor Soporte',
    });

    const res = await request(app)
      .get('/protected-sla')
      .set('Authorization', 'Bearer valid-supervisor-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('debe rechazar con 403 si el token pertenece a un tenant diferente (Cross-Tenant isolation)', async () => {
    const app = createTestApp();

    vi.spyOn(authService, 'verifyAccessToken').mockReturnValue({
      userId: 'hacker-01',
      tenantId: 'tenant-OTHER-ORGANIZATION',
      email: 'user@other.cl',
      role: 'ORG_ADMIN',
      fullName: 'Other Admin',
    });

    const res = await request(app)
      .get('/protected-sla')
      .set('Authorization', 'Bearer cross-tenant-token');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('CROSS_TENANT_ACCESS_DENIED');
  });
});
