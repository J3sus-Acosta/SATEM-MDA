import { describe, it, expect, vi } from 'vitest';
import { AuthService } from '../../src/services/authService';
import { prisma } from '../../src/infrastructure/database/prismaClient';

describe('Integration: AuthService JWT & Refresh Token Rotation', () => {
  const authService = new AuthService();

  it('debe generar y verificar contraseñas con bcrypt correctamente', async () => {
    const rawPass = 'SecretP@ssword2026';
    const hash = await authService.hashPassword(rawPass);

    expect(hash).not.toBe(rawPass);
    const isValid = await authService.verifyPassword(rawPass, hash);
    expect(isValid).toBe(true);

    const isWrong = await authService.verifyPassword('WrongPass', hash);
    expect(isWrong).toBe(false);
  });

  it('debe emitir y validar JWT access tokens de corta duración', () => {
    const payload = {
      userId: 'user-abc',
      tenantId: 'tenant-xyz',
      email: 'agente@satem.cl',
      role: 'SUPPORT_AGENT',
      fullName: 'Agente Prueba',
    };

    const token = authService.generateAccessToken(payload);
    expect(typeof token).toBe('string');

    const decoded = authService.verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.tenantId).toBe(payload.tenantId);
    expect(decoded.email).toBe(payload.email);
  });

  it('debe rotar el refresh token y emitir uno nuevo manteniendo la familia', async () => {
    const userId = 'user-test-01';
    const familyId = 'family-session-01';

    // Mock prisma refreshToken methods
    vi.spyOn(prisma.refreshToken, 'create').mockResolvedValue({
      id: 'token-db-1',
      userId,
      tokenHash: 'dummy-hash',
      familyId,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 100000),
      createdAt: new Date(),
    });

    vi.spyOn(prisma.refreshToken, 'findUnique').mockResolvedValue({
      id: 'token-db-1',
      userId,
      tokenHash: 'token-hash-1',
      familyId,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 100000),
      createdAt: new Date(),
      user: {
        id: userId,
        tenantId: 'tenant-01',
        email: 'user@test.cl',
        fullName: 'User Test',
        role: 'SUPPORT_AGENT',
        isActive: true,
      },
    } as any);

    const updateSpy = vi.spyOn(prisma.refreshToken, 'update').mockResolvedValue({} as any);

    const result = await authService.rotateRefreshToken('valid-raw-token-123');

    expect(result.accessToken).toBeDefined();
    expect(result.newRefreshToken).toBeDefined();
    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 'token-db-1' },
      data: { isRevoked: true },
    });
  });

  it('debe detectar reutilización de token (Replay Attack) y revocar la familia completa', async () => {
    const familyId = 'family-compromised-99';

    vi.spyOn(prisma.refreshToken, 'findUnique').mockResolvedValue({
      id: 'token-already-used',
      userId: 'user-02',
      tokenHash: 'hash-already-used',
      familyId,
      isRevoked: true, // Ya estaba revocado!
      expiresAt: new Date(Date.now() + 100000),
      createdAt: new Date(),
      user: { id: 'user-02', isActive: true },
    } as any);

    const revokeFamilySpy = vi.spyOn(prisma.refreshToken, 'updateMany').mockResolvedValue({ count: 2 } as any);

    await expect(authService.rotateRefreshToken('reused-token')).rejects.toThrow('TOKEN_REUSE_DETECTED');

    expect(revokeFamilySpy).toHaveBeenCalledWith({
      where: { familyId },
      data: { isRevoked: true },
    });
  });
});
