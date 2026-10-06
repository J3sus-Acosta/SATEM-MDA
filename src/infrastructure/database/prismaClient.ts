import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

const TENANT_SCOPED_MODELS = [
  'User',
  'Group',
  'Ticket',
  'SlaPolicy',
  'BusinessHours',
  'WorkflowRule',
  'Macro',
  'AuditLog',
  'WebhookSubscription',
] as const;

type TenantScopedModel = typeof TENANT_SCOPED_MODELS[number];

/**
 * Retorna una instancia extendida de Prisma que inyecta automáticamente
 * el filtro tenantId en todas las operaciones de consulta y mutación para evitar
 * fugas de datos entre organizaciones.
 */
export function getTenantPrisma(tenantId: string) {
  if (!tenantId || typeof tenantId !== 'string') {
    throw new Error('Tenant ID obligatorio para operar en contexto multi-inquilino');
  }

  return prisma.$extends({
    name: 'tenant-isolation',
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.includes(model as TenantScopedModel)) {
            args.where = { ...(args.where || {}), tenantId };
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.includes(model as TenantScopedModel)) {
            args.where = { ...(args.where || {}), tenantId };
          }
          return query(args);
        },
        async count({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.includes(model as TenantScopedModel)) {
            args.where = { ...(args.where || {}), tenantId };
          }
          return query(args);
        },
        async create({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.includes(model as TenantScopedModel)) {
            (args.data as Record<string, unknown>).tenantId = tenantId;
          }
          return query(args);
        },
        async updateMany({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.includes(model as TenantScopedModel)) {
            args.where = { ...(args.where || {}), tenantId };
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.includes(model as TenantScopedModel)) {
            args.where = { ...(args.where || {}), tenantId };
          }
          return query(args);
        },
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof getTenantPrisma>;
