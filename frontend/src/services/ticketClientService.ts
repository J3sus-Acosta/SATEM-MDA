import { ApiClient } from '../api/client';
import { TicketSummary, TicketDetail } from '../features/agent-workbench/TicketWorkbench';

export class TicketClientService {
  private client: ApiClient;
  private isOnline: boolean = false;

  constructor(client: ApiClient) {
    this.client = client;
  }

  isApiLive(): boolean {
    return this.isOnline;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await this.client.request<{ status: string }>('/health', { method: 'GET' });
      this.isOnline = res.success || false;
      return this.isOnline;
    } catch {
      this.isOnline = false;
      return false;
    }
  }

  async fetchTickets(fallbackTickets: TicketSummary[]): Promise<{ tickets: TicketSummary[]; isLive: boolean }> {
    try {
      const res = await this.client.request<any[]>('/tickets', { method: 'GET' });
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        this.isOnline = true;
        const mapped: TicketSummary[] = res.data.map((item: any) => ({
          id: item.id,
          ticketCode: item.ticketCode || `TICK-${item.id.slice(0, 4)}`,
          title: item.title,
          requesterName: item.requester?.fullName || 'Solicitante',
          status: item.status,
          priority: item.priority,
          slaHealth: item.isSlaPaused ? 'PENDING' : 'MET',
          slaDueText: item.isSlaPaused ? 'SLA Pausado' : 'Dentro de SLA',
          assigneeId: item.assigneeId,
          assigneeName: item.assignee?.fullName || 'Sin Asignar',
          groupId: item.groupId,
          groupName: item.group?.name || 'Soporte N1',
        }));
        return { tickets: mapped, isLive: true };
      }
    } catch {
      // Fallback a almacenamiento local / datos demo
    }
    this.isOnline = false;
    return { tickets: fallbackTickets, isLive: false };
  }

  async createTicket(
    data: { title: string; description: string; priority: string; channel?: string },
    localFallbackGenerator: () => TicketSummary
  ): Promise<{ ticket: TicketSummary; isLive: boolean }> {
    try {
      const res = await this.client.request<any>('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          priority: data.priority,
          channel: data.channel || 'PORTAL',
        }),
      });

      if (res.success && res.data) {
        this.isOnline = true;
        const item = res.data;
        const created: TicketSummary = {
          id: item.id,
          ticketCode: item.ticketCode || `TICK-${item.id.slice(0, 4)}`,
          title: item.title,
          requesterName: item.requester?.fullName || 'Solicitante',
          status: item.status,
          priority: item.priority,
          slaHealth: 'MET',
          slaDueText: 'Vence en 4h',
          assigneeName: 'Sin Asignar',
        };
        return { ticket: created, isLive: true };
      }
    } catch {
      // Fallback
    }
    this.isOnline = false;
    return { ticket: localFallbackGenerator(), isLive: false };
  }

  async updateTicketStatus(
    ticketId: string,
    status: string
  ): Promise<{ success: boolean; isLive: boolean }> {
    try {
      const res = await this.client.request(`/tickets/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (res.success) {
        this.isOnline = true;
        return { success: true, isLive: true };
      }
    } catch {
      // Fallback local
    }
    this.isOnline = false;
    return { success: true, isLive: false };
  }
}
