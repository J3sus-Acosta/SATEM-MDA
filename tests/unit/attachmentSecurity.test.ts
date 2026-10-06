import { describe, it, expect } from 'vitest';
import { AttachmentService } from '../../src/services/attachmentService';

describe('Unit: Attachment Security and Validation', () => {
  const service = new AttachmentService();

  it('debe rechazar terminantemente archivos ejecutables peligrosos (.exe, .bat, .sh)', () => {
    const maliciousFiles = [
      { fileName: 'installer.exe', sizeBytes: 1024, mimeType: 'application/octet-stream' },
      { fileName: 'script.sh', sizeBytes: 500, mimeType: 'text/x-sh' },
      { fileName: 'payload.bat', sizeBytes: 200, mimeType: 'application/x-bat' },
    ];

    for (const file of maliciousFiles) {
      const res = service.validateFile(file);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('EXTENSION_PROHIBIDA');
    }
  });

  it('debe rechazar archivos que excedan el límite de 15 MB', () => {
    const oversizedFile = {
      fileName: 'database_dump.zip',
      sizeBytes: 20 * 1024 * 1024, // 20 MB
      mimeType: 'application/zip',
    };

    const res = service.validateFile(oversizedFile);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('LIMITE_TAMANO_EXCEDIDO');
  });

  it('debe aceptar archivos válidos (PDFs, imágenes)', () => {
    const validFile = {
      fileName: 'factura_soporte.pdf',
      sizeBytes: 250 * 1024, // 250 KB
      mimeType: 'application/pdf',
    };

    const res = service.validateFile(validFile);
    expect(res.isValid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it('debe generar una clave de almacenamiento aislada por tenant y UUID', () => {
    const key = service.generateStorageKey('tenant-10', 'ticket-500', 'pantallazo.png');
    expect(key).toMatch(/^tenants\/tenant-10\/tickets\/ticket-500\/[a-f0-9-]+\.png$/);
  });

  it('debe calcular correctamente el hash criptográfico SHA-256 del contenido', () => {
    const buffer = Buffer.from('contenido de prueba satem 2026');
    const hash = service.computeHash(buffer);
    expect(hash).toHaveLength(64);
  });
});
