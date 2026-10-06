import { describe, it, expect, vi } from 'vitest';
import { WebhookDispatcher } from '../../src/services/multichannel/webhookDispatcher';

describe('Unit: Webhook Signature & Exponential Backoff Delivery', () => {
  const dispatcher = new WebhookDispatcher();
  const secretKey = 'webhook_secret_key_satem_enterprise_2026';

  it('debe generar una firma HMAC SHA-256 válida y verificarla correctamente', () => {
    const payload = JSON.stringify({ event: 'ticket.created', id: 't-1' });
    const nowSecs = Math.floor(Date.now() / 1000);

    const signature = dispatcher.createSignature(secretKey, payload, nowSecs);
    expect(signature).toContain('t=');
    expect(signature).toContain('v1=');

    const isValid = dispatcher.verifySignature(secretKey, payload, signature);
    expect(isValid).toBe(true);
  });

  it('debe rechazar la firma si el payload fue alterado (Tampering)', () => {
    const payload = JSON.stringify({ event: 'ticket.created', id: 't-1' });
    const tamperedPayload = JSON.stringify({ event: 'ticket.created', id: 't-1', injected: true });
    const nowSecs = Math.floor(Date.now() / 1000);

    const signature = dispatcher.createSignature(secretKey, payload, nowSecs);
    const isValid = dispatcher.verifySignature(secretKey, tamperedPayload, signature);

    expect(isValid).toBe(false);
  });

  it('debe reintentar el despacho ante fallos temporales hasta tener éxito', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 2) {
        throw new Error('Network error temporal');
      }
      return { ok: true, status: 200 };
    });

    const payload = {
      id: 'evt-1',
      event: 'ticket.created',
      timestamp: Math.floor(Date.now() / 1000),
      tenantId: 'tenant-1',
      data: { ticketCode: 'TICK-1001' },
    };

    const result = await dispatcher.dispatch('https://api.external.com/webhook', secretKey, payload, mockFetch as any, 3);

    expect(result.success).toBe(true);
    expect(result.attempts).toBe(2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
