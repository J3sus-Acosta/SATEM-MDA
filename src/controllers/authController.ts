import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { prisma } from '../infrastructure/database/prismaClient';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const tenant = req.tenant;

      if (!tenant) {
        res.status(400).json({ error: 'MISSING_TENANT', message: 'Se requiere contexto de tenant (X-Tenant-ID o subdominio).' });
        return;
      }

      const user = await prisma.user.findFirst({
        where: {
          tenantId: tenant.id,
          email: email.toLowerCase().trim(),
        },
      });

      if (!user || !user.isActive) {
        res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas o usuario inactivo.' });
        return;
      }

      const isValid = await authService.verifyPassword(password, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas.' });
        return;
      }

      const accessToken = authService.generateAccessToken({
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      });

      const refreshToken = await authService.createRefreshToken(user.id);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      });

      res.json({
        success: true,
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          tenantId: user.tenantId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) {
        res.status(400).json({ error: 'MISSING_REFRESH_TOKEN', message: 'No se suministró token de refresco.' });
        return;
      }

      const result = await authService.rotateRefreshToken(token);

      res.cookie('refreshToken', result.newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error: any) {
      if (error.message === 'TOKEN_REUSE_DETECTED') {
        res.status(403).json({ error: 'TOKEN_REUSE_DETECTED', message: 'Reutilización indebida de token detectada. Sesión invalidada.' });
        return;
      }
      res.status(401).json({ error: 'UNAUTHORIZED', message: error.message || 'Token de refresco inválido o expirado.' });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) {
      const hash = (authService as any).hashToken?.(token);
      if (hash) {
        await prisma.refreshToken.updateMany({
          where: { tokenHash: hash },
          data: { isRevoked: true },
        });
      }
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Sesión cerrada exitosamente.' });
  }
}

export const authController = new AuthController();
