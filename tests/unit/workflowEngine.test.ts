import { describe, it, expect, vi } from 'vitest';
import { WorkflowRuleEngine, WorkflowRuleDefinition } from '../../src/services/workflow/workflowRuleEngine';

describe('Unit: WorkflowRuleEngine (Automations & Business Rules)', () => {
  const engine = new WorkflowRuleEngine(3);

  it('debe evaluar condiciones compuestas (ALL) y ejecutar acciones coincidentes', async () => {
    const rules: WorkflowRuleDefinition[] = [
      {
        id: 'rule-vip-urgent',
        name: 'Escalar tickets urgentes de correo',
        eventType: 'TICKET_CREATED',
        conditions: {
          all: [
            { field: 'sourceChannel', operator: 'eq', value: 'EMAIL' },
            { field: 'priority', operator: 'eq', value: 'URGENT' },
          ],
        },
        actions: [
          { type: 'ASSIGN_GROUP', value: 'group-l2-infrastructure' },
          { type: 'ADD_TAG', value: 'escalado-automatico' },
        ],
      },
    ];

    const context = {
      title: 'Servidor caído',
      sourceChannel: 'EMAIL',
      priority: 'URGENT',
      tags: ['servidores'],
    };

    const result = await engine.executeRules(rules, context);

    expect(result.appliedRules).toContain('rule-vip-urgent');
    expect(result.updatedContext.groupId).toBe('group-l2-infrastructure');
    expect(result.updatedContext.tags).toContain('escalado-automatico');
  });

  it('no debe aplicar acciones si las condiciones no coinciden', async () => {
    const rules: WorkflowRuleDefinition[] = [
      {
        id: 'rule-1',
        name: 'Regla específica',
        eventType: 'TICKET_CREATED',
        conditions: {
          all: [{ field: 'sourceChannel', operator: 'eq', value: 'API' }],
        },
        actions: [{ type: 'SET_PRIORITY', value: 'LOW' }],
      },
    ];

    const context = { sourceChannel: 'PORTAL', priority: 'HIGH' };
    const result = await engine.executeRules(rules, context);

    expect(result.appliedRules).toHaveLength(0);
    expect(result.updatedContext.priority).toBe('HIGH');
  });

  it('debe prevenir bucles infinitos cortando la ejecución si la profundidad alcanza maxDepth', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const rules: WorkflowRuleDefinition[] = [
      {
        id: 'rule-loop',
        name: 'Regla recursiva',
        eventType: 'TICKET_UPDATED',
        conditions: { all: [{ field: 'priority', operator: 'eq', value: 'HIGH' }] },
        actions: [{ type: 'SET_PRIORITY', value: 'HIGH' }],
      },
    ];

    // Llamada con profundidad límite alcanzada
    const result = await engine.executeRules(rules, { priority: 'HIGH' }, 3);

    expect(result.appliedRules).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalled();
  });
});
