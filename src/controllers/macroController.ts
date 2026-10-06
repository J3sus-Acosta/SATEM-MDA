import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { macroService } from '../services/macroService';

export const ApplyMacroSchema = z.object({
  macroId: z.string().uuid(),
});

export class MacroController {
  async apply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenant!.id;
      const rawId = req.params.id;
      const ticketId = Array.isArray(rawId) ? rawId[0] : rawId;
      const { macroId } = req.body;
      const author = { id: req.user!.id, role: req.user!.role };

      const result = await macroService.applyMacro(tenantId, ticketId, macroId, author);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const macroController = new MacroController();
