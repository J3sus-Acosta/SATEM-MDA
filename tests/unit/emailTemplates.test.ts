import { describe, it, expect } from 'vitest';
import { EmailOutboundService, MockEmailTransport } from '../../src/services/multichannel/emailOutboundService';

describe('Unit: EmailOutboundService (Templates & Delivery)', () => {
  it('debe renderizar la plantilla HTML de ticket creado con las variables requeridas', () => {
    const service = new EmailOutboundService();
    const rendered = service.renderCustomerTicketCreated({
      ticketCode: 'TICK-1025',
      title: 'Acceso bloqueado en portal',
      requesterName: 'Rodrigo Morales',
      portalUrl: 'https://soporte.satem.cl/tickets/TICK-1025',
    });

    expect(rendered.subject).toContain('[TICK-1025]');
    expect(rendered.subject).toContain('Acceso bloqueado en portal');
    expect(rendered.html).toContain('Rodrigo Morales');
    expect(rendered.html).toContain('TICK-1025');
    expect(rendered.html).toContain('https://soporte.satem.cl/tickets/TICK-1025');
    expect(rendered.text).toContain('Equipo de Soporte SATEM');
  });

  it('debe despachar el correo utilizando el transport configurado', async () => {
    const mockTransport = new MockEmailTransport();
    const service = new EmailOutboundService(mockTransport);

    const result = await service.sendTicketCreatedNotification('usuario@cliente.cl', {
      ticketCode: 'TICK-1025',
      title: 'Acceso bloqueado en portal',
      requesterName: 'Rodrigo Morales',
      portalUrl: 'https://soporte.satem.cl/tickets/TICK-1025',
    });

    expect(result.success).toBe(true);
    expect(mockTransport.sentMessages.length).toBe(1);
    expect(mockTransport.sentMessages[0].to).toBe('usuario@cliente.cl');
    expect(mockTransport.sentMessages[0].subject).toContain('[TICK-1025]');
  });
});
