import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../infrastructure/database/prismaClient';
import { AuthenticatedUser } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-1234567890';
const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_DAYS = 7;

export interface TokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  fullName: string;
}

export class AuthService {
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }

  async createRefreshToken(userId: string, existingFamilyId?: string): Promise<string> {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const familyId = existingFamilyId || crypto.randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId,
        expiresAt,
        isRevoked: false,
      },
    });

    return rawToken;
  }

  async rotateRefreshToken(rawToken: string): Promise<{ accessToken: string; newRefreshToken: string; user: AuthenticatedUser }> {
    const tokenHash = this.hashToken(rawToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            tenantId: true,
            email: true,
            fullName: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!storedToken) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    // Detección de Replay Attack: si el token ya fue revocado o usado
    if (storedToken.isRevoked) {
      // Revocar toda la familia de tokens de la sesión comprometida
      await prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId },
        data: { isRevoked: true },
      });
      throw new Error('TOKEN_REUSE_DETECTED');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }

    if (!storedToken.user.isActive) {
      throw new Error('USER_INACTIVE');
    }

    // 1. Invalidar el token actual
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // 2. Emitir nuevo par dentro de la misma familia de sesión
    const newRefreshToken = await this.createRefreshToken(storedToken.userId, storedToken.familyId);
    const accessToken = this.generateAccessToken({
      userId: storedToken.user.id,
      tenantId: storedToken.user.tenantId,
      email: storedToken.user.email,
      role: storedToken.user.role,
      fullName: storedToken.user.fullName,
    });

    return {
      accessToken,
      newRefreshToken,
      user: storedToken.user as AuthenticatedUser,
    };
  }

  async revokeSessionFamily(familyId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { familyId },
      data: { isRevoked: true },
    });
  }
}

export const authService = new AuthService();
