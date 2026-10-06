import { Router } from 'express';
import { ticketController, CreateTicketSchema, UpdateTicketSchema } from '../controllers/ticketController';
import { tenantContextMiddleware } from '../middleware/tenantContext';
import { requireAuth, requirePermission } from '../middleware/rbacMiddleware';
import { validateBody } from '../app';

const router = Router();

router.use(tenantContextMiddleware);
router.use(requireAuth);

router.post(
  '/',
  requirePermission('tickets:create'),
  validateBody(CreateTicketSchema),
  ticketController.create.bind(ticketController)
);

router.get(
  '/',
  requirePermission('tickets:read'),
  ticketController.list.bind(ticketController)
);

router.get(
  '/:id',
  requirePermission('tickets:read'),
  ticketController.getById.bind(ticketController)
);

router.patch(
  '/:id',
  requirePermission('tickets:update'),
  validateBody(UpdateTicketSchema),
  ticketController.update.bind(ticketController)
);

import { macroController, ApplyMacroSchema } from '../controllers/macroController';

router.post(
  '/:id/apply-macro',
  requirePermission('tickets:update'),
  validateBody(ApplyMacroSchema),
  macroController.apply.bind(macroController)
);

export default router;
