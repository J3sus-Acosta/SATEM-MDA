import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  TicketWorkbench,
  filterTicketsByView,
  TicketSummary,
} from '../../frontend/src/features/agent-workbench/TicketWorkbench';

describe('Unit: Sidebar View Filtering & Dynamic Counts', () => {
  const sampleTickets: TicketSummary[] = [
    {
      id: 't-1',
      ticketCode: 'TICK-101',
      title: 'Ticket 1',
      requesterName: 'Ana',
      status: 'OPEN',
      priority: 'HIGH',
      slaHealth: 'MET',
      slaDueText: '2h',
      assigneeId: 'agent-10',
      assigneeName: 'Patricio Soto',
      groupName: 'Soporte N1 (Mesa de Entrada)',
    },
    {
      id: 't-2',
      ticketCode: 'TICK-102',
      title: 'Ticket 2',
      requesterName: 'Luis',
      status: 'NEW',
      priority: 'URGENT',
      slaHealth: 'WARNING',
      slaDueText: '30m',
      assigneeId: undefined, // Sin Asignar
      groupName: 'Soporte N2 (Especialistas)',
    },
    {
      id: 't-3',
      ticketCode: 'TICK-103',
      title: 'Ticket 3',
      requesterName: 'Carlos',
      status: 'PENDING',
      priority: 'MEDIUM',
      slaHealth: 'PENDING',
      slaDueText: 'Pausado',
      assigneeId: 'agent-me',
      assigneeName: 'Administrador SATEM',
      groupName: 'Infraestructura & Redes',
    },
    {
      id: 't-4',
      ticketCode: 'TICK-104',
      title: 'Ticket 4',
      requesterName: 'Maria',
      status: 'SOLVED',
      priority: 'LOW',
      slaHealth: 'MET',
      slaDueText: 'Resuelto',
      assigneeId: 'agent-me',
    },
    {
      id: 't-5',
      ticketCode: 'TICK-105',
      title: 'Ticket 5',
      requesterName: 'Pedro',
      status: 'CLOSED',
      priority: 'LOW',
      slaHealth: 'MET',
      slaDueText: 'Cerrado',
      assigneeId: 'agent-me',
    },
  ];

  it('debe filtrar correctamente por "MY_ASSIGNED"', () => {
    const res = filterTicketsByView(sampleTickets, 'MY_ASSIGNED', 'agent-me');
    expect(res).toHaveLength(3); // t-3, t-4, t-5
    expect(res.map((t) => t.id)).toEqual(['t-3', 't-4', 't-5']);
  });

  it('debe filtrar correctamente por "UNASSIGNED"', () => {
    const res = filterTicketsByView(sampleTickets, 'UNASSIGNED', 'agent-me');
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('t-2');
  });

  it('debe filtrar correctamente por "OPEN" (incluye NEW y OPEN)', () => {
    const res = filterTicketsByView(sampleTickets, 'OPEN', 'agent-me');
    expect(res).toHaveLength(2); // t-1 (OPEN), t-2 (NEW)
    expect(res.map((t) => t.id)).toEqual(['t-1', 't-2']);
  });

  it('debe filtrar correctamente por "PENDING"', () => {
    const res = filterTicketsByView(sampleTickets, 'PENDING', 'agent-me');
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('t-3');
  });

  it('debe filtrar correctamente por "SOLVED" y "CLOSED"', () => {
    const solved = filterTicketsByView(sampleTickets, 'SOLVED', 'agent-me');
    expect(solved).toHaveLength(1);
    expect(solved[0].id).toBe('t-4');

    const closed = filterTicketsByView(sampleTickets, 'CLOSED', 'agent-me');
    expect(closed).toHaveLength(1);
    expect(closed[0].id).toBe('t-5');
  });

  it('debe filtrar correctamente por Grupos de soporte', () => {
    const n2 = filterTicketsByView(sampleTickets, 'GROUP_N2', 'agent-me');
    expect(n2).toHaveLength(1);
    expect(n2[0].id).toBe('t-2');

    const infra = filterTicketsByView(sampleTickets, 'GROUP_INFRA', 'agent-me');
    expect(infra).toHaveLength(1);
    expect(infra[0].id).toBe('t-3');
  });

  it('debe renderizar el menú lateral con las vistas y sus contadores dinámicos', () => {
    const html = renderToString(
      React.createElement(TicketWorkbench, {
        currentUserId: 'agent-me',
        tickets: sampleTickets,
        onSelectTicket: () => {},
        onSubmitReply: () => {},
      })
    );

    expect(html).toContain('Todos los Tickets');
    expect(html).toContain('Mis Asignados');
    expect(html).toContain('Tickets Sin Asignar');
    expect(html).toContain('Abiertos / En Curso');
    expect(html).toContain('Grupos de Soporte');
    expect(html).toContain('Mesa de Entrada N1');
  });
});
