import { describe, it, expect, vi } from 'vitest';
import { ApiClient } from '../../frontend/src/api/client';

describe('Unit: Frontend ApiClient (Interceptors & Auth)', () => {
  it('debe adjuntar las cabeceras X-Tenant-ID y Authorization Bearer en las peticiones', async () => {
    const client = new ApiClient('/api/v1');
    client.setTenant('tenant-acme');
    client.setAccessToken('jwt-token-123');

    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    const res = await client.get('/tickets', mockFetch as any);

    expect(res.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/tickets',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Tenant-ID': 'tenant-acme',
          Authorization: 'Bearer jwt-token-123',
        }),
      })
    );
  });

  it('debe reintentar la solicitud tras refrescar el token si recibe 401', async () => {
    const client = new ApiClient('/api/v1');
    client.setTenant('tenant-acme');
    client.setAccessToken('expired-token');

    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/auth/refresh')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ accessToken: 'new-refreshed-token' }),
        });
      }

      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          status: 401,
          json: () => Promise.resolve({ error: 'TOKEN_EXPIRED' }),
        });
      }

      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve({ success: true, data: { reloaded: true } }),
      });
    });

    const res = await client.get('/tickets/1', mockFetch as any);

    expect(res.success).toBe(true);
    expect(client.getAccessToken()).toBe('new-refreshed-token');
  });
});
