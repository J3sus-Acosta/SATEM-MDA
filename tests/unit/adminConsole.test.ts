import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AdminConsole } from '../../frontend/src/features/admin-console/AdminConsole';

describe('Unit: AdminConsole (Metrics, SLA, Workflows)', () => {
  it('debe renderizar el tablero con métricas clave operativas', () => {
    const props = {
      tenantName: 'SATEM Soluciones Cloud',
      metrics: {
        totalTickets: 1250,
        openTickets: 42,
        mtfrMinutes: 18,
        mttrMinutes: 95,
        slaCompliancePct: 94,
        csatAverage: 4.8,
      },
      policies: [
        {
          id: 'p-1',
          name: 'SLA Estándar Empresa',
          isDefault: true,
          targets: [
            { priority: 'URGENT', frtMins: 30, resMins: 120 },
            { priority: 'HIGH', frtMins: 60, resMins: 240 },
          ],
        },
      ],
    };

    const html = renderToString(React.createElement(AdminConsole, props));

    expect(html).toContain('Consola de Administración');
    expect(html).toContain('SATEM Soluciones Cloud');
    expect(html).toContain('1250'); // Total tickets
    expect(html).toContain('Tiempo Medio 1ra Respuesta');
    expect(html).toContain('Tiempo Medio Resolución');
    expect(html).toContain('Cumplimiento de SLA');
    expect(html).toContain('Satisfacción Cliente');
  });
});
