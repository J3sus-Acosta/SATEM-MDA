import { describe, it, expect, beforeEach } from 'vitest';
import { TicketAssignmentStrategy } from '../../src/services/workflow/ticketAssignmentStrategy';

describe('Unit: TicketAssignmentStrategy (Round-Robin & Least-Load)', () => {
  let strategy: TicketAssignmentStrategy;

  beforeEach(() => {
    strategy = new TicketAssignmentStrategy();
  });

  it('debe rotar equitativamente los agentes mediante Round-Robin (A -> B -> C -> A)', () => {
    const groupId = 'group-infra';
    const agents = ['agent-1', 'agent-2', 'agent-3'];

    expect(strategy.assignRoundRobin(groupId, agents)).toBe('agent-1');
    expect(strategy.assignRoundRobin(groupId, agents)).toBe('agent-2');
    expect(strategy.assignRoundRobin(groupId, agents)).toBe('agent-3');
    // Vuelta al inicio
    expect(strategy.assignRoundRobin(groupId, agents)).toBe('agent-1');
  });

  it('debe asignar al agente con menor carga de tickets abiertos (Least-Load)', () => {
    const loads = [
      { userId: 'agent-busy', openTicketCount: 15 },
      { userId: 'agent-free', openTicketCount: 2 },
      { userId: 'agent-moderate', openTicketCount: 8 },
    ];

    const selected = strategy.assignLeastLoad(loads);
    expect(selected).toBe('agent-free');
  });

  it('debe retornar null si la lista de agentes está vacía', () => {
    expect(strategy.assignRoundRobin('group-empty', [])).toBeNull();
    expect(strategy.assignLeastLoad([])).toBeNull();
  });
});
