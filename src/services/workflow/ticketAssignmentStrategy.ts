export interface AgentLoad {
  userId: string;
  openTicketCount: number;
}

export class TicketAssignmentStrategy {
  private roundRobinCursors: Map<string, number> = new Map();

  assignRoundRobin(groupId: string, availableAgentIds: string[]): string | null {
    if (!availableAgentIds || availableAgentIds.length === 0) {
      return null;
    }

    const currentCursor = this.roundRobinCursors.get(groupId) || 0;
    const nextIndex = currentCursor % availableAgentIds.length;
    const selectedAgentId = availableAgentIds[nextIndex];

    // Avanzar cursor circular
    this.roundRobinCursors.set(groupId, (nextIndex + 1) % availableAgentIds.length);

    return selectedAgentId;
  }

  assignLeastLoad(agentLoads: AgentLoad[]): string | null {
    if (!agentLoads || agentLoads.length === 0) {
      return null;
    }

    // Ordenar de menor a mayor carga de tickets abiertos
    const sorted = [...agentLoads].sort((a, b) => a.openTicketCount - b.openTicketCount);
    return sorted[0].userId;
  }

  resetCursor(groupId: string): void {
    this.roundRobinCursors.delete(groupId);
  }
}

export const ticketAssignmentStrategy = new TicketAssignmentStrategy();
