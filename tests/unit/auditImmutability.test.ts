import { describe, it, expect, vi } from 'vitest';
import { AuditService } from '../../src/services/auditService';
import * as prismaModule from '../../src/infrastructure/database/prismaClient';

describe('Unit: Audit Trail Immutability & Logging', () => {
  const service = new AuditService();

  it('debe registrar un evento de auditoría con actor, diff e IP', async () => {
    const mockPrisma = {
      auditLog: {
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'audit-001', ...data })),
      },
    };
    vi.spyOn(prismaModule, 'getTenantPrisma').mockReturnValue(mockPrisma as any);

    const result = await service.log({
      tenantId: 'tenant-1',
      userId: 'user-agent-1',
      ticketId: 'ticket-100',
      action: 'STATUS_CHANGE',
      entity: 'Ticket',
      entityId: 'ticket-100',
      ipAddress: '192.168.1.50',
      userAgent: 'Mozilla/5.0 Chrome',
      changesDiff: { status: { old: 'NEW', new: 'OPEN' } },
    });

    expect(result.id).toBe('audit-001');
    expect(result.action).toBe('STATUS_CHANGE');
    expect(result.ipAddress).toBe('192.168.1.50');
    expect(mockPrisma.auditLog.create).toHaveBeenCalled();
  });

  it('debe consultar logs de auditoría con filtros paginados', async () => {
    const mockFindMany = vi.fn().mockResolvedValue([
      { id: 'audit-1', entity: 'Ticket', action: 'CREATE' }
    ]);
    vi.spyOn(prismaModule, 'getTenantPrisma').mockReturnValue({
      auditLog: { findMany: mockFindMany },
    } as any);

    const logs = await service.queryLogs('tenant-1', {
      entity: 'Ticket',
      page: 2,
      limit: 10,
      fromDate: new Date('2026-01-01'),
      toDate: new Date('2026-12-31'),
    });

    expect(logs).toHaveLength(1);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          entity: 'Ticket',
        }),
      })
    );
  });

  it('debe impedir terminantemente la modificación o borrado de registros (Append-Only)', async () => {
    await expect(service.updateAuditLog()).rejects.toThrow('AUDIT_LOG_IMMUTABLE');
    await expect(service.deleteAuditLog()).rejects.toThrow('AUDIT_LOG_IMMUTABLE');
  });
});
