import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AgentCollisionBanner } from '../../frontend/src/features/agent-workbench/AgentCollisionBanner';
import { TicketWorkbench } from '../../frontend/src/features/agent-workbench/TicketWorkbench';

describe('Unit: TicketWorkbench and AgentCollisionBanner', () => {
  it('AgentCollisionBanner no debe renderizar nada si no hay otros agentes visualizando', () => {
    const html = renderToString(
      React.createElement(AgentCollisionBanner, {
        currentUserId: 'agent-1',
        viewers: [{ socketId: 's1', userId: 'agent-1', fullName: 'Carlos' }],
      })
    );
    expect(html).toBe('');
  });

  it('AgentCollisionBanner debe renderizar la advertencia si otro agente está viendo el ticket', () => {
    const html = renderToString(
      React.createElement(AgentCollisionBanner, {
        currentUserId: 'agent-1',
        viewers: [
          { socketId: 's1', userId: 'agent-1', fullName: 'Carlos' },
          { socketId: 's2', userId: 'agent-2', fullName: 'Maria Gonzalez' },
        ],
      })
    );
    expect(html).toContain('Maria Gonzalez');
    expect(html).toContain('Alerta de Colisión');
  });

  it('TicketWorkbench debe renderizar correctamente la estructura de 3 columnas', () => {
    const props = {
      currentUserId: 'agent-1',
      tickets: [
        {
          id: 't-1',
          ticketCode: 'TICK-1001',
          title: 'Problema VPN',
          requesterName: 'Juan',
          status: 'OPEN' as const,
          priority: 'HIGH' as const,
          slaHealth: 'WARNING' as const,
          slaDueText: 'en 15m',
        },
      ],
      onSelectTicket: () => {},
      onSubmitReply: () => {},
    };

    const html = renderToString(React.createElement(TicketWorkbench, props));
    expect(html).toContain('SATEM Desk');
    expect(html).toContain('TICK-1001');
    expect(html).toContain('Bandeja de Entrada');
  });
});
