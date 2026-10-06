import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import * as prismaModule from '../../src/infrastructure/database/prismaClient';
import ticketRoutes from '../../src/routes/ticketRoutes';
import { setTenantFinder } from '../../src/middleware/tenantContext';
import { authService } from '../../src/services/authService';
import { ticketService } from '../../src/services/ticketService';

describe('Integration: Ticket REST API', () => {
  let app: express.Express;

  const mockTenantPrisma = {
    ticket: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock tenant resolver
    setTenantFinder({
      async findByIdOrSlug() {
        return {
          id: 'tenant-100',
          slug: 'satem-cloud',
          name: 'SATEM Cloud',
          plan: 'ENTERPRISE',
          timezone: 'America/Santiago',
          isActive: true,
        };
      },
    });

    // Mock getTenantPrisma
    vi.spyOn(prismaModule, 'getTenantPrisma').mockReturnValue(mockTenantPrisma as any);

    // Mock auth verification
    vi.spyOn(authService, 'verifyAccessToken').mockReturnValue({
      userId: 'agent-10',
      tenantId: 'tenant-100',
      email: 'agente@satem.cl',
      role: 'SUPPORT_AGENT',
      fullName: 'Agente Satem',
    });

    app.use('/api/v1/tickets', ticketRoutes);
  });

  it('POST /api/v1/tickets debe crear un ticket con código correlativo (201)', async () => {
    vi.spyOn(ticketService, 'createTicket').mockResolvedValue({
      id: 'ticket-uuid-1',
      tenantId: 'tenant-100',
      ticketCode: 'TICK-1001',
      title: 'Falla en acceso VPN',
      description: 'Usuario no puede conectar desde sucursal',
      priority: 'HIGH',
      status: 'NEW',
      type: 'INCIDENT',
    } as any);

    const res = await request(app)
      .post('/api/v1/tickets')
      .set('X-Tenant-ID', 'tenant-100')
      .set('Authorization', 'Bearer valid-token')
      .send({
        title: 'Falla en acceso VPN',
        description: 'Usuario no puede conectar desde sucursal',
        priority: 'HIGH',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticketCode).toBe('TICK-1001');
  });

  it('GET /api/v1/tickets debe retornar el listado paginado (200)', async () => {
    mockTenantPrisma.ticket.findMany.mockResolvedValue([
      {
        id: 'ticket-uuid-1',
        ticketCode: 'TICK-1001',
        title: 'Falla en acceso VPN',
        status: 'NEW',
        priority: 'HIGH',
      },
    ]);
    mockTenantPrisma.ticket.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/api/v1/tickets?page=1&limit=10')
      .set('X-Tenant-ID', 'tenant-100')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data.length).toBe(1);
  });

  it('PATCH /api/v1/tickets/:id debe actualizar el estado y prioridad del ticket (200)', async () => {
    vi.spyOn(ticketService, 'updateTicketStatus').mockResolvedValue({ count: 1 } as any);
    mockTenantPrisma.ticket.updateMany.mockResolvedValue({ count: 1 });
    mockTenantPrisma.ticket.findFirst.mockResolvedValue({
      id: 'ticket-uuid-1',
      status: 'OPEN',
      priority: 'URGENT',
      ticketCode: 'TICK-1001',
    });

    const res = await request(app)
      .patch('/api/v1/tickets/ticket-uuid-1')
      .set('X-Tenant-ID', 'tenant-100')
      .set('Authorization', 'Bearer valid-token')
      .send({
        status: 'OPEN',
        priority: 'URGENT',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('OPEN');
  });
});
