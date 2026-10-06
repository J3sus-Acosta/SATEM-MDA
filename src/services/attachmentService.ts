import crypto from 'crypto';
import path from 'path';

export const MAX_ATTACHMENT_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export const BLOCKED_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.msi',
  '.vbs',
  '.js',
  '.ps1',
  '.com',
  '.scr',
  '.pif',
];

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
];

export interface FilePayload {
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  buffer?: Buffer;
}

export class AttachmentService {
  validateFile(file: FilePayload): { isValid: boolean; error?: string } {
    if (!file.fileName || file.fileName.trim().length === 0) {
      return { isValid: false, error: 'NOMBRE_ARCHIVO_INVALIDO' };
    }

    const ext = path.extname(file.fileName).toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return {
        isValid: false,
        error: `EXTENSION_PROHIBIDA: La extensión '${ext}' no está permitida por políticas de seguridad.`,
      };
    }

    if (file.sizeBytes > MAX_ATTACHMENT_SIZE_BYTES) {
      return {
        isValid: false,
        error: `LIMITE_TAMANO_EXCEDIDO: El archivo excede el tamaño máximo permitido de 15MB.`,
      };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimeType.toLowerCase())) {
      return {
        isValid: false,
        error: `TIPO_MIME_NO_SOPORTADO: El tipo MIME '${file.mimeType}' no es compatible.`,
      };
    }

    return { isValid: true };
  }

  generateStorageKey(tenantId: string, ticketId: string, originalFileName: string): string {
    const ext = path.extname(originalFileName).toLowerCase();
    const uniqueId = crypto.randomUUID();
    return `tenants/${tenantId}/tickets/${ticketId}/${uniqueId}${ext}`;
  }

  computeHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}

export const attachmentService = new AttachmentService();
