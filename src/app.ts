import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { ZodSchema, ZodError } from 'zod';
import './types';

export function createApp() {
  const app = express();

  // 1. Cabeceras HTTP de seguridad (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS dinámico
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error('CORS_ORIGIN_NOT_ALLOWED'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Tenant-Slug'],
    })
  );

  // 3. Rate Limiter por IP / Tenant
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 500, // Máximo 500 peticiones por ventana
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => {
      const tenantKey = req.headers['x-tenant-id'] || 'no-tenant';
      return `${req.ip}_${tenantKey}`;
    },
    message: {
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes. Por favor intente más tarde.',
    },
  });
  app.use('/api/', limiter);

  // 4. Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // 5. Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'satem-helpdesk-platform',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  return app;
}

/**
 * Middleware para validar el body de la petición utilizando Zod
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Error de validación en los datos enviados.',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Manejador central de errores
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    error: err.code || err.name || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Ha ocurrido un error inesperado.',
    ...(isProduction ? {} : { stack: err.stack }),
  });
}

export const app = createApp();
