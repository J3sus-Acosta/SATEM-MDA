import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PERMISSIONS = [
  { action: 'tickets:read', resource: 'tickets', description: 'Ver tickets asignados o públicos' },
  { action: 'tickets:read_all', resource: 'tickets', description: 'Ver todos los tickets del tenant' },
  { action: 'tickets:create', resource: 'tickets', description: 'Crear nuevos tickets' },
  { action: 'tickets:update', resource: 'tickets', description: 'Modificar estado, prioridad y datos del ticket' },
  { action: 'tickets:assign', resource: 'tickets', description: 'Asignar tickets a grupos o agentes' },
  { action: 'tickets:delete', resource: 'tickets', description: 'Eliminar o cerrar definitivamente tickets' },
  { action: 'tickets:internal_notes', resource: 'tickets', description: 'Leer y redactar notas internas privadas' },
  { action: 'sla:manage', resource: 'sla', description: 'Configurar calendarios y políticas de SLA' },
  { action: 'workflows:manage', resource: 'workflows', description: 'Crear reglas de enrutamiento y macros' },
  { action: 'audit:read', resource: 'audit', description: 'Consultar logs de auditoría y trazabilidad' },
  { action: 'tenants:manage', resource: 'tenants', description: 'Administrar configuración del tenant y cuotas' },
];

const ROLES = [
  {
    name: 'SuperAdmin',
    description: 'Acceso total global a la plataforma SATEM ONE',
    permissions: DEFAULT_PERMISSIONS.map((p) => p.action),
  },
  {
    name: 'OrgAdmin',
    description: 'Administrador de organización con control total sobre su tenant',
    permissions: DEFAULT_PERMISSIONS.map((p) => p.action),
  },
  {
    name: 'SupportSupervisor',
    description: 'Supervisor de soporte con gestión de colas, asignaciones y analíticas',
    permissions: [
      'tickets:read',
      'tickets:read_all',
      'tickets:create',
      'tickets:update',
      'tickets:assign',
      'tickets:internal_notes',
      'sla:manage',
      'workflows:manage',
      'audit:read',
    ],
  },
  {
    name: 'SupportAgent',
    description: 'Agente resolutor de mesa de ayuda con acceso a notas internas y macros',
    permissions: [
      'tickets:read',
      'tickets:read_all',
      'tickets:create',
      'tickets:update',
      'tickets:internal_notes',
    ],
  },
  {
    name: 'Requester',
    description: 'Usuario final o cliente solicitante de soporte',
    permissions: ['tickets:read', 'tickets:create'],
  },
];

export async function seedDatabase(client: PrismaClient = prisma) {
  console.log('Iniciando seeding de roles y permisos base SATEM...');

  // 1. Crear permisos
  for (const perm of DEFAULT_PERMISSIONS) {
    await client.permission.upsert({
      where: { action: perm.action },
      update: { description: perm.description, resource: perm.resource },
      create: perm,
    });
  }

  // 2. Crear roles y conectar permisos
  for (const roleDef of ROLES) {
    await client.role.upsert({
      where: { name: roleDef.name },
      update: {
        description: roleDef.description,
        permissions: {
          connect: roleDef.permissions.map((action) => ({ action })),
        },
      },
      create: {
        name: roleDef.name,
        description: roleDef.description,
        permissions: {
          connect: roleDef.permissions.map((action) => ({ action })),
        },
      },
    });
  }

  // 3. Crear Tenant demostrativo inicial
  const demoTenant = await client.tenant.upsert({
    where: { slug: 'satem-demo' },
    update: {},
    create: {
      name: 'SATEM Demo Enterprise',
      slug: 'satem-demo',
      subdomain: 'demo',
      timezone: 'America/Santiago',
      plan: 'ENTERPRISE',
      maxAgents: 20,
      maxMonthlyTickets: 10000,
    },
  });

  // 4. Crear usuario administrador demo
  const passwordHash = await bcrypt.hash('SatemAdmin2026!', 10);
  await client.user.upsert({
    where: {
      tenantId_email: {
        tenantId: demoTenant.id,
        email: 'admin@satem.cl',
      },
    },
    update: { passwordHash },
    create: {
      tenantId: demoTenant.id,
      email: 'admin@satem.cl',
      fullName: 'Administrador SATEM',
      passwordHash,
      role: 'ORG_ADMIN',
    },
  });

  console.log('Seeding completado exitosamente.');
}

if (require.main === module) {
  seedDatabase()
    .catch((e) => {
      console.error('Error durante seeding:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
