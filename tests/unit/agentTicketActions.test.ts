import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { NewTicketModal } from '../../frontend/src/features/agent-workbench/NewTicketModal';
import { TicketWorkbench } from '../../frontend/src/features/agent-workbench/TicketWorkbench';

describe('Unit: Agent Ticket Actions & NewTicketModal', () => {
  it('NewTicketModal debe renderizar campos de solicitante, título, descripción y prioridad cuando está abierto', () => {
    const html = renderToString(
      React.createElement(NewTicketModal, {
        isOpen: true,
        onClose: () => {},
        onCreate: () => {},
      })
    );

    expect(html).toContain('Nuevo Ticket de Soporte');
    expect(html).toContain('Solicitante (Cliente o Empleado)');
    expect(html).toContain('Asunto / Título');
    expect(html).toContain('Prioridad');
    expect(html).toContain('Grupo Asignado');
  });

  it('NewTicketModal no debe renderizar nada si isOpen es false', () => {
    const html = renderToString(
      React.createElement(NewTicketModal, {
        isOpen: false,
        onClose: () => {},
        onCreate: () => {},
      })
    );

    expect(html).toBe('');
  });

  it('TicketWorkbench debe renderizar selectores interactivos de Estado, Prioridad y Asignado en la barra de propiedades', () => {
    const mockTicket = {
      id: 't-101',
      ticketCode: 'TICK-1001',
      title: 'Ticket Test',
      description: 'Detalle de prueba',
      requesterName: 'Rodrigo',
      status: 'OPEN' as const,
      priority: 'HIGH' as const,
      slaHealth: 'MET' as const,
      slaDueText: '3h',
      createdAt: '12:00',
      messages: [],
    };

    const html = renderToString(
      React.createElement(TicketWorkbench, {
        currentUserId: 'user-admin',
        tickets: [mockTicket],
        activeTicket: mockTicket,
        onSelectTicket: () => {},
        onSubmitReply: () => {},
      })
    );

    expect(html).toContain('Propiedades');
    expect(html).toContain('Estado');
    expect(html).toContain('Prioridad');
    expect(html).toContain('Grupo Resolutor');
    expect(html).toContain('Agente Asignado');
    expect(html).toContain('Macro:');
  });
});
