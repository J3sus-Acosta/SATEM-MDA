import React, { useState } from 'react';
import { AgentCollisionBanner, ViewerInfo } from './AgentCollisionBanner';
import { NewTicketModal } from './NewTicketModal';

export interface TicketSummary {
  id: string;
  ticketCode: string;
  title: string;
  requesterName: string;
  status: 'NEW' | 'OPEN' | 'PENDING' | 'ON_HOLD' | 'SOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  slaHealth: 'MET' | 'PENDING' | 'WARNING' | 'BREACHED';
  slaDueText: string;
  assigneeId?: string;
  assigneeName?: string;
  groupId?: string;
  groupName?: string;
}

export interface TicketDetail extends TicketSummary {
  description: string;
  createdAt: string;
  messages: Array<{
    id: string;
    authorName: string;
    authorRole: string;
    type: 'PUBLIC_REPLY' | 'INTERNAL_NOTE';
    body: string;
    createdAt: string;
  }>;
}

export interface TicketWorkbenchProps {
  currentUserId: string;
  tickets: TicketSummary[];
  activeTicket?: TicketDetail;
  viewers?: ViewerInfo[];
  onSelectTicket: (ticketId: string) => void;
  onSubmitReply: (type: 'PUBLIC_REPLY' | 'INTERNAL_NOTE', text: string) => void;
  onApplyMacro?: (macroId: string) => void;
  onUpdateTicketProperty?: (ticketId: string, property: 'status' | 'priority' | 'assignee' | 'group', value: string) => void;
  onCreateNewTicket?: (data: {
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    requesterName: string;
    groupName: string;
  }) => void;
}

export type SidebarViewId =
  | 'MY_ASSIGNED'
  | 'UNASSIGNED'
  | 'OPEN'
  | 'PENDING'
  | 'SOLVED'
  | 'CLOSED'
  | 'ALL'
  | 'GROUP_N1'
  | 'GROUP_N2'
  | 'GROUP_INFRA';

export function filterTicketsByView(
  tickets: TicketSummary[],
  view: SidebarViewId,
  currentUserId: string
): TicketSummary[] {
  switch (view) {
    case 'MY_ASSIGNED':
      return tickets.filter(
        (t) =>
          t.assigneeId === currentUserId ||
          t.assigneeName?.toLowerCase().includes('tú') ||
          t.assigneeName === 'Administrador SATEM'
      );
    case 'UNASSIGNED':
      return tickets.filter((t) => !t.assigneeId && t.status !== 'CLOSED');
    case 'OPEN':
      return tickets.filter((t) => t.status === 'NEW' || t.status === 'OPEN');
    case 'PENDING':
      return tickets.filter((t) => t.status === 'PENDING' || t.status === 'ON_HOLD');
    case 'SOLVED':
      return tickets.filter((t) => t.status === 'SOLVED');
    case 'CLOSED':
      return tickets.filter((t) => t.status === 'CLOSED');
    case 'GROUP_N1':
      return tickets.filter((t) => !t.groupName || t.groupName.includes('N1'));
    case 'GROUP_N2':
      return tickets.filter((t) => t.groupName?.includes('N2'));
    case 'GROUP_INFRA':
      return tickets.filter((t) => t.groupName?.includes('Infraestructura'));
    case 'ALL':
    default:
      return tickets;
  }
}

export const TicketWorkbench: React.FC<TicketWorkbenchProps> = ({
  currentUserId,
  tickets,
  activeTicket,
  viewers = [],
  onSelectTicket,
  onSubmitReply,
  onApplyMacro,
  onUpdateTicketProperty,
  onCreateNewTicket,
}) => {
  const [selectedView, setSelectedView] = useState<SidebarViewId>('ALL');
  const [activeTab, setActiveTab] = useState<'PUBLIC_REPLY' | 'INTERNAL_NOTE'>('PUBLIC_REPLY');
  const [replyText, setReplyText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtrado reactivo de tickets según la vista seleccionada en el menú izquierdo
  const filteredTickets = filterTicketsByView(tickets, selectedView, currentUserId);

  const getPriorityBadgeColor = (p: string) => {
    switch (p) {
      case 'URGENT':
        return '#f5222d';
      case 'HIGH':
        return '#fa8c16';
      case 'MEDIUM':
        return '#1890ff';
      default:
        return '#52c41a';
    }
  };

  const getSlaBadge = (health: string, dueText: string) => {
    let bg = '#e6f7ff';
    let color = '#096dd9';
    if (health === 'WARNING') {
      bg = '#fffbe6';
      color = '#d48806';
    } else if (health === 'BREACHED') {
      bg = '#fff1f0';
      color = '#cf1322';
    }
    return (
      <span
        style={{
          background: bg,
          color,
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 6px',
          borderRadius: '4px',
        }}
      >
        SLA: {dueText}
      </span>
    );
  };

  const sidebarViews: Array<{ id: SidebarViewId; label: string; icon: string }> = [
    { id: 'ALL', label: 'Todos los Tickets', icon: '📂' },
    { id: 'MY_ASSIGNED', label: 'Mis Asignados', icon: '👤' },
    { id: 'UNASSIGNED', label: 'Tickets Sin Asignar', icon: '📥' },
    { id: 'OPEN', label: 'Abiertos / En Curso', icon: '🟢' },
    { id: 'PENDING', label: 'En Espera (Pending)', icon: '⏳' },
    { id: 'SOLVED', label: 'Resueltos (Solved)', icon: '✅' },
    { id: 'CLOSED', label: 'Cerrados Definitivos', icon: '🔒' },
  ];

  const groupViews: Array<{ id: SidebarViewId; label: string }> = [
    { id: 'GROUP_N1', label: 'Mesa de Entrada N1' },
    { id: 'GROUP_N2', label: 'Especialistas N2' },
    { id: 'GROUP_INFRA', label: 'Infraestructura & Redes' },
  ];

  const handleMacroSelect = (macroType: string) => {
    if (macroType === 'solicitar_info') {
      setReplyText(
        'Estimado usuario,\n\nHemos recibido su solicitud. Para poder brindarle asistencia adecuada, ¿podría proporcionarnos más detalles, mensajes de error o capturas de pantalla?\n\nAtentamente,\nEquipo de Mesa de Ayuda SATEM'
      );
      if (activeTicket && onUpdateTicketProperty) {
        onUpdateTicketProperty(activeTicket.id, 'status', 'PENDING');
      }
    } else if (macroType === 'resuelto_estandar') {
      setReplyText(
        'Estimado usuario,\n\nLe informamos que el requerimiento ha sido atendido y resuelto satisfactoriamente por nuestro equipo técnico. Si continúa experimentando inconvenientes, puede responder a este mismo mensaje para reabrir el caso.\n\nGracias por contactar a SATEM.'
      );
      if (activeTicket && onUpdateTicketProperty) {
        onUpdateTicketProperty(activeTicket.id, 'status', 'SOLVED');
      }
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: "'Inter', sans-serif", backgroundColor: '#f0f2f5', overflow: 'hidden' }}>
      {/* Modal de Nuevo Ticket */}
      <NewTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={(data) => {
          if (onCreateNewTicket) {
            onCreateNewTicket(data);
          }
        }}
      />

      {/* Columna 1: Menú Lateral Izquierdo (Vistas y Carpetas ITSM) */}
      <div
        style={{
          width: '240px',
          background: '#090d16',
          borderRight: '1px solid #1e293b',
          color: '#cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🗂️</span>
          <span style={{ fontWeight: 700, fontSize: '13px', color: '#f8fafc', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
            SATEM Desk — Vistas
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          {/* Lista de Carpetas Principales */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {sidebarViews.map((item) => {
              const count = filterTicketsByView(tickets, item.id, currentUserId).length;
              const isSelected = selectedView === item.id;
              return (
                <li
                  key={item.id}
                  onClick={() => setSelectedView(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#1e293b' : 'transparent',
                    color: isSelected ? '#38bdf8' : '#94a3b8',
                    fontSize: '13px',
                    fontWeight: isSelected ? 600 : 500,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <span
                    style={{
                      backgroundColor: isSelected ? '#0284c7' : '#1e293b',
                      color: isSelected ? '#fff' : '#64748b',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '10px',
                    }}
                  >
                    {count}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Filtros por Grupo Resolutor */}
          <div style={{ marginTop: '24px', padding: '0 8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Grupos de Soporte
            </span>
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {groupViews.map((g) => {
                const count = filterTicketsByView(tickets, g.id, currentUserId).length;
                const isSelected = selectedView === g.id;
                return (
                  <li
                    key={g.id}
                    onClick={() => setSelectedView(g.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#1e293b' : 'transparent',
                      color: isSelected ? '#38bdf8' : '#94a3b8',
                      fontSize: '12px',
                    }}
                  >
                    <span>👥 {g.label}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{count}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Columna 2: Listado Central de Tickets */}
      <div
        style={{
          width: '340px',
          background: '#fff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
              Bandeja de Entrada ({filteredTickets.length})
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Vista: {sidebarViews.find((v) => v.id === selectedView)?.label || groupViews.find((g) => g.id === selectedView)?.label}
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>+</span> Nuevo
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredTickets.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              No hay tickets que coincidan con la vista seleccionada.
            </div>
          ) : (
            filteredTickets.map((t) => {
              const isActive = activeTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    background: isActive ? '#f0f9ff' : '#fff',
                    borderLeft: isActive ? '3px solid #0284c7' : '3px solid transparent',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#0284c7' }}>{t.ticketCode}</span>
                    <span
                      style={{
                        backgroundColor: getPriorityBadgeColor(t.priority),
                        color: '#fff',
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                      }}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b', marginBottom: '6px', lineHeight: 1.3 }}>
                    {t.title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>👤 {t.requesterName}</span>
                    {getSlaBadge(t.slaHealth, t.slaDueText)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Columna 3: Detalle del Ticket y Respuestas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTicket ? (
          <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
            {/* Panel Principal de Conversación */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              {/* Collision Alert Banner */}
              <AgentCollisionBanner currentUserId={currentUserId} viewers={viewers as any} />

              {/* Encabezado del Ticket */}
              <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#0284c7' }}>{activeTicket.ticketCode}</span>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#475569' }}>
                    {activeTicket.status}
                  </span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Creado: {activeTicket.createdAt}</span>
                </div>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{activeTicket.title}</h1>
              </div>

              {/* Hilo de Mensajes */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Descripción Inicial */}
                <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: '#64748b' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>👤 {activeTicket.requesterName} (Solicitante)</span>
                    <span>Descripción del Ticket</span>
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: 1.5, color: '#334155', whiteSpace: 'pre-line' }}>
                    {activeTicket.description}
                  </div>
                </div>

                {/* Mensajes Posteriores */}
                {activeTicket.messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: m.type === 'INTERNAL_NOTE' ? '#fefce8' : '#fff',
                      border: m.type === 'INTERNAL_NOTE' ? '1px solid #fef08a' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '16px 20px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                      <span style={{ fontWeight: 600, color: m.type === 'INTERNAL_NOTE' ? '#854d0e' : '#0f172a' }}>
                        {m.type === 'INTERNAL_NOTE' ? '🔒 Nota Interna — ' : '💬 '} {m.authorName}
                      </span>
                      <span style={{ color: '#94a3b8' }}>{m.createdAt}</span>
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#334155', whiteSpace: 'pre-line' }}>
                      {m.body}
                    </div>
                  </div>
                ))}
              </div>

              {/* Compositor de Respuestas */}
              <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('PUBLIC_REPLY')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid #2563eb',
                        backgroundColor: activeTab === 'PUBLIC_REPLY' ? '#2563eb' : '#fff',
                        color: activeTab === 'PUBLIC_REPLY' ? '#fff' : '#2563eb',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Respuesta Pública
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('INTERNAL_NOTE')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid #eab308',
                        backgroundColor: activeTab === 'INTERNAL_NOTE' ? '#fef08a' : '#fff',
                        color: activeTab === 'INTERNAL_NOTE' ? '#854d0e' : '#a16207',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      🔒 Nota Interna Privada
                    </button>
                  </div>

                  {/* Selector Rápido de Macros */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>⚡ Macro:</span>
                    <select
                      onChange={(e) => {
                        handleMacroSelect(e.target.value);
                        e.target.value = '';
                      }}
                      defaultValue=""
                      style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#f8fafc',
                      }}
                    >
                      <option value="" disabled>Seleccionar acción rápida...</option>
                      <option value="solicitar_info">Solicitar más información (+ Pendiente)</option>
                      <option value="resuelto_estandar">Cierre estándar de solución (+ Resuelto)</option>
                    </select>
                  </div>
                </div>

                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    activeTab === 'PUBLIC_REPLY'
                      ? 'Escribe tu respuesta que verá el solicitante...'
                      : 'Escribe una nota confidencial visible únicamente por agentes...'
                  }
                  style={{
                    width: '100%',
                    height: '80px',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: activeTab === 'INTERNAL_NOTE' ? '#fefce8' : '#fff',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (replyText.trim()) {
                        onSubmitReply(activeTab, replyText);
                        setReplyText('');
                      }
                    }}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: activeTab === 'PUBLIC_REPLY' ? '#2563eb' : '#eab308',
                      color: activeTab === 'PUBLIC_REPLY' ? '#fff' : '#713f12',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Enviar {activeTab === 'PUBLIC_REPLY' ? 'Respuesta Pública' : 'Nota Interna'}
                  </button>
                </div>
              </div>
            </div>

            {/* Barra Lateral Derecha de Propiedades Interactivas */}
            <div
              style={{
                width: '240px',
                background: '#fff',
                borderLeft: '1px solid #e2e8f0',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                flexShrink: 0,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Propiedades
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  Estado
                </label>
                <select
                  value={activeTicket.status}
                  onChange={(e) => {
                    if (onUpdateTicketProperty) {
                      onUpdateTicketProperty(activeTicket.id, 'status', e.target.value);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#f8fafc',
                    fontWeight: 600,
                  }}
                >
                  <option value="NEW">Nuevo (New)</option>
                  <option value="OPEN">Abierto (Open)</option>
                  <option value="PENDING">Pendiente (Pending)</option>
                  <option value="ON_HOLD">En Espera (On-Hold)</option>
                  <option value="SOLVED">Resuelto (Solved)</option>
                  <option value="CLOSED">Cerrado (Closed)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  Prioridad
                </label>
                <select
                  value={activeTicket.priority}
                  onChange={(e) => {
                    if (onUpdateTicketProperty) {
                      onUpdateTicketProperty(activeTicket.id, 'priority', e.target.value);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#f8fafc',
                    fontWeight: 600,
                  }}
                >
                  <option value="LOW">Baja (Low)</option>
                  <option value="MEDIUM">Media (Medium)</option>
                  <option value="HIGH">Alta (High)</option>
                  <option value="URGENT">Urgente (Urgent)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  Grupo Resolutor
                </label>
                <select
                  value={activeTicket.groupName || 'Soporte N1 (Mesa de Entrada)'}
                  onChange={(e) => {
                    if (onUpdateTicketProperty) {
                      onUpdateTicketProperty(activeTicket.id, 'group', e.target.value);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <option value="Soporte N1 (Mesa de Entrada)">Soporte N1 (Mesa de Entrada)</option>
                  <option value="Soporte N2 (Especialistas)">Soporte N2 (Especialistas)</option>
                  <option value="Infraestructura & Redes">Infraestructura & Redes</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  Agente Asignado
                </label>
                <select
                  value={activeTicket.assigneeName || 'Sin Asignar'}
                  onChange={(e) => {
                    if (onUpdateTicketProperty) {
                      onUpdateTicketProperty(activeTicket.id, 'assignee', e.target.value);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <option value="Sin Asignar">Sin Asignar</option>
                  <option value="Administrador SATEM">Administrador SATEM (Tú)</option>
                  <option value="Patricio Soto">Patricio Soto</option>
                  <option value="Alejandro Morales">Alejandro Morales</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
            Selecciona un ticket de la bandeja para ver sus detalles.
          </div>
        )}
      </div>
    </div>
  );
};
