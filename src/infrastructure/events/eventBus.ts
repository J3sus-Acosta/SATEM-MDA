import { EventEmitter } from 'events';

export interface TicketCreatedEvent {
  ticketId: string;
  tenantId: string;
  ticketCode: string;
  title: string;
  priority: string;
  requesterId: string;
}

export interface TicketUpdatedEvent {
  ticketId: string;
  tenantId: string;
  changes: Record<string, unknown>;
  actorUserId?: string;
}

export interface SlaEvent {
  ticketId: string;
  tenantId: string;
  metric: 'FIRST_RESPONSE' | 'RESOLUTION';
  dueAt: Date;
}

export interface AppEventMap {
  'ticket:created': TicketCreatedEvent;
  'ticket:updated': TicketUpdatedEvent;
  'sla:warning': SlaEvent;
  'sla:breached': SlaEvent;
}

export type EventHandler<T> = (payload: T) => Promise<void> | void;

export class TypedEventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50);
  }

  on<K extends keyof AppEventMap>(event: K, handler: EventHandler<AppEventMap[K]>): void {
    this.emitter.on(event, async (payload) => {
      try {
        await handler(payload);
      } catch (err) {
        console.error(`[EventBus] Error procesando evento '${event}':`, err);
      }
    });
  }

  once<K extends keyof AppEventMap>(event: K, handler: EventHandler<AppEventMap[K]>): void {
    this.emitter.once(event, async (payload) => {
      try {
        await handler(payload);
      } catch (err) {
        console.error(`[EventBus] Error procesando evento once '${event}':`, err);
      }
    });
  }

  emit<K extends keyof AppEventMap>(event: K, payload: AppEventMap[K]): boolean {
    return this.emitter.emit(event, payload);
  }

  removeAllListeners(event?: keyof AppEventMap): void {
    this.emitter.removeAllListeners(event);
  }
}

export const eventBus = new TypedEventBus();
