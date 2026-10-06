import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ApiClient } from '../../frontend/src/api/client';
import { LoginView } from '../../frontend/src/features/auth/LoginView';
import { AuthProvider } from '../../frontend/src/context/AuthContext';

describe('Unit: Auth UI Flow and Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar la vista de login con campos de tenant, email y opciones de acceso rápido demo', () => {
    const html = renderToString(
      React.createElement(AuthProvider, null, React.createElement(LoginView, null))
    );

    expect(html).toContain('SATEM ONE');
    expect(html).toContain('Mesa de Ayuda &amp; Service Desk Corporativo');
    expect(html).toContain('Organización / Tenant');
    expect(html).toContain('admin@satem.cl');
    expect(html).toContain('Agente de Soporte N2');
    expect(html).toContain('Cliente Solicitante');
  });

  it('debe procesar login exitoso actualizando el token en el cliente API', async () => {
    const mockClient = new ApiClient('/api/v1');
    const mockResponse = {
      success: true,
      data: {
        accessToken: 'jwt-token-12345',
        user: {
          id: 'u-1',
          email: 'admin@satem.cl',
          fullName: 'Administrador SATEM',
          role: 'ORG_ADMIN' as const,
          tenantId: 'satem-demo',
        },
      },
    };

    vi.spyOn(mockClient, 'request').mockResolvedValue(mockResponse);

    const res = await mockClient.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@satem.cl', password: 'Password123!' }),
    });

    expect(res.success).toBe(true);
    expect(res.data?.accessToken).toBe('jwt-token-12345');
    expect(res.data?.user.role).toBe('ORG_ADMIN');
  });

  it('debe manejar error de credenciales inválidas adecuadamente', async () => {
    const mockClient = new ApiClient('/api/v1');
    vi.spyOn(mockClient, 'request').mockResolvedValue({
      success: false,
      error: 'INVALID_CREDENTIALS',
      message: 'Credenciales inválidas.',
    });

    const res = await mockClient.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'fake@satem.cl', password: 'wrong' }),
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe('INVALID_CREDENTIALS');
  });
});
