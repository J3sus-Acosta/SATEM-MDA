import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { z } from 'zod';
import { createApp, validateBody } from '../../src/app';

describe('Integration: Security Headers and Request Validation', () => {
  const app = createApp();

  const SampleSchema = z.object({
    title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  });

  app.post('/api/test-validation', validateBody(SampleSchema), (req, res) => {
    res.json({ success: true, data: req.body });
  });

  it('debe responder con cabeceras de seguridad Helmet', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    // Helmet headers
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
  });

  it('debe rechazar con 400 y detalles claros cuando el payload no cumple el esquema Zod', async () => {
    const res = await request(app)
      .post('/api/test-validation')
      .send({
        title: 'ab', // Demasiado corto
        priority: 'INVALID_PRIORITY',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details.length).toBeGreaterThanOrEqual(2);
  });

  it('debe aceptar y procesar cuando el payload es válido según el esquema Zod', async () => {
    const res = await request(app)
      .post('/api/test-validation')
      .send({
        title: 'Error de conexión en base de datos',
        priority: 'HIGH',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.priority).toBe('HIGH');
  });
});
