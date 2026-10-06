import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CustomerPortal } from '../../frontend/src/features/customer-portal/CustomerPortal';

describe('Unit: CustomerPortal (End-User Portal)', () => {
  it('debe renderizar la lista de solicitudes del cliente solicitante', () => {
    const props = {
      tenantName: 'SATEM Enterprise Demo',
      tickets: [
        {
          id: 't-10',
          ticketCode: 'TICK-1010',
          title: 'Error de login con certificado',
          status: 'OPEN',
          createdAt: '2026-10-04',
          lastUpdate: 'Hace 1 hora',
        },
      ],
      onCreateTicket: () => {},
      onViewTicket: () => {},
    };

    const html = renderToString(React.createElement(CustomerPortal, props));

    expect(html).toContain('Portal de Ayuda');
    expect(html).toContain('SATEM Enterprise Demo');
    expect(html).toContain('TICK-1010');
    expect(html).toContain('Error de login con certificado');
    expect(html).toContain('+ Abrir Nueva Solicitud');
  });
});
