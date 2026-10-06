import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createServer } from 'http';
import { HelpdeskSocketServer } from '../../src/infrastructure/websocket/socketServer';
import { authService } from '../../src/services/authService';

describe('Integration: Agent Collision Detection and WebSockets', () => {
  let server: ReturnType<typeof createServer>;
  let socketServer: HelpdeskSocketServer;

  beforeEach(() => {
    server = createServer();
    socketServer = new HelpdeskSocketServer();

    vi.spyOn(authService, 'verifyAccessToken').mockImplementation((token: string) => {
      if (token === 'token-agent-1') {
        return { userId: 'agent-1', tenantId: 'tenant-1', fullName: 'Carlos Agente 1', role: 'SUPPORT_AGENT', email: 'a1@satem.cl' };
      }
      if (token === 'token-agent-2') {
        return { userId: 'agent-2', tenantId: 'tenant-1', fullName: 'Maria Agente 2', role: 'SUPPORT_AGENT', email: 'a2@satem.cl' };
      }
      throw new Error('INVALID_TOKEN');
    });
  });

  afterEach(() => {
    server.close();
  });

  it('debe instanciar y configurar el servidor de WebSockets', () => {
    const io = socketServer.attach(server);
    expect(io).toBeDefined();
  });

  it('debe registrar y retornar viewers vacíos cuando nadie está en el ticket', () => {
    const viewers = socketServer.getTicketViewers('ticket-none');
    expect(viewers).toEqual([]);
  });
});
