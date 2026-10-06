import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './features/auth/LoginView';
import { TicketWorkbench, TicketSummary, TicketDetail } from './features/agent-workbench/TicketWorkbench';
import { CustomerPortal, CustomerTicket } from './features/customer-portal/CustomerPortal';
import { AdminConsole, SlaPolicyItem } from './features/admin-console/AdminConsole';
import { TicketClientService } from './services/ticketClientService';

export const AppContent: React.FC = () => {
  const { user, isAuthenticated, logout, apiClient } = useAuth();
  const [currentModule, setCurrentModule] = useState<'AGENT' | 'PORTAL' | 'ADMIN'>('AGENT');
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);

  const ticketClientService = useMemo(() => new TicketClientService(apiClient), [apiClient]);

  useEffect(() => {
    let active = true;
    ticketClientService.checkHealth().then((online) => {
      if (active) setIsLiveApi(online);
    });
    return () => {
      active = false;
    };
  }, [ticketClientService]);

  // Redirigir según el rol del usuario autenticado
  useEffect(() => {
    if (user) {
      if (user.role === 'REQUESTER') {
        setCurrentModule('PORTAL');
      } else {
        setCurrentModule('AGENT');
      }
    }
  }, [user]);

  // Datos interactivos de Tickets
  const [tickets, setTickets] = useState<TicketSummary[]>([
    {
      id: 'tick-1',
      ticketCode: 'TICK-1001',
      title: 'Ticket de Prueba Inicial — Verificación Docker y API',
      requesterName: 'Administrador SATEM',
      status: 'OPEN',
      priority: 'HIGH',
      slaHealth: 'MET',
      slaDueText: 'Vence en 3h 45m',
    },
    {
      id: 'tick-2',
      ticketCode: 'TICK-1002',
      title: 'Problema de conectividad con VPN Corporativa Santiago',
      requesterName: 'Carlos Sepúlveda',
      status: 'NEW',
      priority: 'URGENT',
      slaHealth: 'WARNING',
      slaDueText: 'Vence en 42m (Riesgo)',
    },
    {
      id: 'tick-3',
      ticketCode: 'TICK-1003',
      title: 'Solicitud de acceso a módulo de reportería analítica',
      requesterName: 'María José Rivera',
      status: 'PENDING',
      priority: 'MEDIUM',
      slaHealth: 'PENDING',
      slaDueText: 'SLA Pausado (esperando cliente)',
    },
  ]);

  const [activeTicketId, setActiveTicketId] = useState<string>('tick-1');

  const [ticketDetails, setTicketDetails] = useState<Record<string, TicketDetail>>({
    'tick-1': {
      id: 'tick-1',
      ticketCode: 'TICK-1001',
      title: 'Ticket de Prueba Inicial — Verificación Docker y API',
      description: 'Verificación del despliegue en contenedores Docker y correcto funcionamiento del backend de tickets y SLA.',
      requesterName: 'Administrador SATEM',
      status: 'OPEN',
      priority: 'HIGH',
      slaHealth: 'MET',
      slaDueText: 'Vence en 3h 45m',
      createdAt: '2026-10-04 01:52',
      messages: [
        {
          id: 'msg-1',
          authorName: 'Sistema de Ingesta SATEM',
          authorRole: 'SYSTEM',
          type: 'PUBLIC_REPLY',
          body: 'Ticket registrado con éxito mediante API REST. SLA calculado con horario hábil de lunes a viernes.',
          createdAt: '01:52',
        },
        {
          id: 'msg-2',
          authorName: 'Patricio Soto (Soporte N2)',
          authorRole: 'SupportAgent',
          type: 'INTERNAL_NOTE',
          body: 'Nota interna privada: Revisé la base de datos PostgreSQL en contenedor y los esquemas están sincronizados al 100%.',
          createdAt: '01:53',
        },
      ],
    },
    'tick-2': {
      id: 'tick-2',
      ticketCode: 'TICK-1002',
      title: 'Problema de conectividad con VPN Corporativa Santiago',
      description: 'El usuario no logra autenticarse al túnel VPN de Santiago desde las 08:30 AM tras cambio de credenciales.',
      requesterName: 'Carlos Sepúlveda',
      status: 'NEW',
      priority: 'URGENT',
      slaHealth: 'WARNING',
      slaDueText: 'Vence en 42m (Riesgo)',
      createdAt: '2026-10-04 01:45',
      messages: [
        {
          id: 'msg-201',
          authorName: 'Carlos Sepúlveda',
          authorRole: 'Requester',
          type: 'PUBLIC_REPLY',
          body: 'Adjunto captura del error 691. Me urge para acceder a los servidores de producción.',
          createdAt: '01:45',
        },
      ],
    },
  });

  // Si no está autenticado, renderizar la pantalla de Login
  if (!isAuthenticated || !user) {
    return (
      <LoginView
        onBypassDemo={(role) => {
          // Permite explorar como rol demo si el backend no estuviera corriendo
          const mockUser = {
            id: role === 'REQUESTER' ? 'user-requester' : 'user-admin',
            email: role === 'REQUESTER' ? 'cliente.demo@satem.cl' : 'admin@satem.cl',
            fullName: role === 'REQUESTER' ? 'Carlos Sepúlveda (Cliente)' : 'Administrador SATEM',
            role,
            tenantId: 'satem-demo',
          };
          sessionStorage.setItem('satem_helpdesk_user', JSON.stringify(mockUser));
          sessionStorage.setItem('satem_helpdesk_token', 'mock-demo-token');
          window.location.reload();
        }}
      />
    );
  }

  // Manejar respuesta en ticket
  const handleReply = (type: 'PUBLIC_REPLY' | 'INTERNAL_NOTE', text: string) => {
    if (!text.trim()) return;

    setTicketDetails((prev) => {
      const current = prev[activeTicketId] || {
        ...tickets.find((t) => t.id === activeTicketId)!,
        description: 'Detalle de ticket',
        createdAt: 'Hoy',
        messages: [],
      };

      const newMsg = {
        id: `msg-${Date.now()}`,
        authorName: `${user.fullName} (Tú)`,
        authorRole: user.role,
        type,
        body: text,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      return {
        ...prev,
        [activeTicketId]: {
          ...current,
          messages: [...current.messages, newMsg],
          status: type === 'PUBLIC_REPLY' ? 'OPEN' : current.status,
        },
      };
    });
  };

  // Manejar creación de ticket desde Portal del Solicitante
  const handleCreateCustomerTicket = (data: { title: string; category: string; description: string; priority: string }) => {
    const nextCode = `TICK-${1000 + tickets.length + 1}`;
    const newId = `tick-${Date.now()}`;

    const newTicket: TicketSummary = {
      id: newId,
      ticketCode: nextCode,
      title: data.title,
      requesterName: user.fullName || 'Usuario Portal',
      status: 'NEW',
      priority: data.priority as any,
      slaHealth: 'MET',
      slaDueText: 'Vence en 4h 00m',
    };

    setTickets((prev) => [newTicket, ...prev]);

    setTicketDetails((prev) => ({
      ...prev,
      [newId]: {
        ...newTicket,
        description: `[Categoría: ${data.category}]\n\n${data.description}`,
        createdAt: 'Recién creado',
        messages: [
          {
            id: `msg-${Date.now()}`,
            authorName: user.fullName,
            authorRole: user.role,
            type: 'PUBLIC_REPLY',
            body: data.description,
            createdAt: 'Ahora',
          },
        ],
      },
    }));

    setActiveTicketId(newId);
    alert(`¡Ticket ${nextCode} registrado exitosamente!`);
  };

  const customerPortalTickets: CustomerTicket[] = tickets.map((t) => ({
    id: t.id,
    ticketCode: t.ticketCode,
    title: t.title,
    status: t.status,
    createdAt: 'Hoy',
    lastUpdate: 'Hace momentos',
  }));

  const policies: SlaPolicyItem[] = [
    {
      id: 'pol-1',
      name: 'SLA Estándar Soporte TI (9x5)',
      isDefault: true,
      targets: [
        { priority: 'URGENT', frtMins: 30, resMins: 120 },
        { priority: 'HIGH', frtMins: 60, resMins: 240 },
        { priority: 'MEDIUM', frtMins: 240, resMins: 480 },
        { priority: 'LOW', frtMins: 480, resMins: 1440 },
      ],
    },
    {
      id: 'pol-2',
      name: 'SLA Clientes VIP 24x7',
      isDefault: false,
      targets: [
        { priority: 'URGENT', frtMins: 15, resMins: 60 },
        { priority: 'HIGH', frtMins: 30, resMins: 120 },
        { priority: 'MEDIUM', frtMins: 120, resMins: 360 },
        { priority: 'LOW', frtMins: 240, resMins: 720 },
      ],
    },
  ];

  // Manejar creación de ticket desde Workbench de Agente
  const handleAgentCreateTicket = (data: {
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    requesterName: string;
    groupName: string;
  }) => {
    const nextCode = `TICK-${1000 + tickets.length + 1}`;
    const newId = `tick-${Date.now()}`;

    const newTicket: TicketSummary = {
      id: newId,
      ticketCode: nextCode,
      title: data.title,
      requesterName: data.requesterName,
      status: 'NEW',
      priority: data.priority,
      slaHealth: 'MET',
      slaDueText: 'Vence en 4h',
      groupName: data.groupName,
      assigneeName: user?.fullName || 'Administrador SATEM',
      assigneeId: user?.id || 'user-admin',
    };

    setTickets((prev) => [newTicket, ...prev]);
    setTicketDetails((prev) => ({
      ...prev,
      [newId]: {
        ...newTicket,
        description: data.description,
        createdAt: 'Ahora',
        messages: [
          {
            id: `msg-${Date.now()}`,
            authorName: user?.fullName || 'Agente',
            authorRole: user?.role || 'SUPPORT_AGENT',
            type: 'INTERNAL_NOTE',
            body: `Ticket registrado por soporte en nombre de ${data.requesterName}.`,
            createdAt: 'Ahora',
          },
        ],
      },
    }));
    setActiveTicketId(newId);
  };

  // Manejar actualización interactiva de propiedades del ticket
  const handleUpdateTicketProperty = (
    ticketId: string,
    property: 'status' | 'priority' | 'assignee' | 'group',
    value: string
  ) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          if (property === 'status') {
            const isPaused = value === 'PENDING' || value === 'ON_HOLD';
            return {
              ...t,
              status: value as any,
              slaHealth: isPaused ? 'PENDING' : t.slaHealth,
              slaDueText: isPaused ? 'Pausado' : t.slaDueText,
            };
          }
          if (property === 'priority') return { ...t, priority: value as any };
          if (property === 'assignee') {
            return {
              ...t,
              assigneeName: value,
              assigneeId: value.includes('SATEM') ? user?.id : 'agent-other',
            };
          }
          if (property === 'group') return { ...t, groupName: value };
        }
        return t;
      })
    );

    setTicketDetails((prev) => {
      const current = prev[ticketId];
      if (!current) return prev;
      const updated = { ...current };
      if (property === 'status') {
        updated.status = value as any;
        const isPaused = value === 'PENDING' || value === 'ON_HOLD';
        updated.slaHealth = isPaused ? 'PENDING' : updated.slaHealth;
        updated.slaDueText = isPaused ? 'Pausado' : updated.slaDueText;
      }
      if (property === 'priority') updated.priority = value as any;
      if (property === 'assignee') {
        updated.assigneeName = value;
        updated.assigneeId = value.includes('SATEM') ? user?.id : 'agent-other';
      }
      if (property === 'group') updated.groupName = value;
      return { ...prev, [ticketId]: updated };
    });
  };

  const isRequester = user.role === 'REQUESTER';
  const isAdmin = user.role === 'ORG_ADMIN' || user.role === 'SUPER_ADMIN';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Barra de Navegación Global de Módulos */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0f172a',
          padding: '0 24px',
          height: '56px',
          borderBottom: '1px solid #1e293b',
          color: '#f8fafc',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '14px',
            }}
          >
            S
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.3px' }}>SATEM ONE</span>
            <span
              style={{
                fontSize: '11px',
                color: '#94a3b8',
                marginLeft: '8px',
                padding: '2px 6px',
                backgroundColor: '#1e293b',
                borderRadius: '4px',
              }}
            >
              {user.tenantId}
            </span>
          </div>
        </div>

        {/* Switcher de Vistas (Según Rol) */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isRequester && (
            <button
              onClick={() => setCurrentModule('AGENT')}
              style={{
                backgroundColor: currentModule === 'AGENT' ? '#2563eb' : 'transparent',
                color: currentModule === 'AGENT' ? '#fff' : '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              🛠️ Workbench de Agente
            </button>
          )}

          <button
            onClick={() => setCurrentModule('PORTAL')}
            style={{
              backgroundColor: currentModule === 'PORTAL' ? '#2563eb' : 'transparent',
              color: currentModule === 'PORTAL' ? '#fff' : '#94a3b8',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            🙋‍♂️ Portal del Solicitante
          </button>

          {isAdmin && (
            <button
              onClick={() => setCurrentModule('ADMIN')}
              style={{
                backgroundColor: currentModule === 'ADMIN' ? '#2563eb' : 'transparent',
                color: currentModule === 'ADMIN' ? '#fff' : '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              ⚙️ Consola de Administración
            </button>
          )}
        </div>

        {/* Perfil de Usuario, Estado de Conexión y Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Indicador de Conexión */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: isLiveApi ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
              border: isLiveApi ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)',
              color: isLiveApi ? '#4ade80' : '#facc15',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: isLiveApi ? '#22c55e' : '#eab308',
                display: 'inline-block',
              }}
            />
            <span>{isLiveApi ? 'API En Línea (:4000)' : 'Modo Local / Demo'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '13px',
              }}
            >
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>{user.fullName}</span>
              <span style={{ fontSize: '11px', color: '#38bdf8' }}>{user.role}</span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            title="Cerrar Sesión"
            style={{
              backgroundColor: 'transparent',
              color: '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Salir ↩
          </button>
        </div>
      </nav>

      {/* Contenido Dinámico de la Pantalla Seleccionada */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {currentModule === 'AGENT' && !isRequester && (
          <TicketWorkbench
            currentUserId={user.id}
            tickets={tickets}
            activeTicket={ticketDetails[activeTicketId] || ticketDetails['tick-1']}
            viewers={[
              { userId: 'user-2', userName: 'Alejandro Morales (Soporte N1)', isTyping: true },
            ]}
            onSelectTicket={(id) => setActiveTicketId(id)}
            onSubmitReply={handleReply}
            onCreateNewTicket={handleAgentCreateTicket}
            onUpdateTicketProperty={handleUpdateTicketProperty}
          />
        )}

        {currentModule === 'PORTAL' && (
          <CustomerPortal
            tenantName="SATEM Soluciones Inteligentes"
            tickets={customerPortalTickets}
            onCreateTicket={handleCreateCustomerTicket}
            onViewTicket={(id) => {
              setActiveTicketId(id);
              if (!isRequester) {
                setCurrentModule('AGENT');
              }
            }}
          />
        )}

        {currentModule === 'ADMIN' && isAdmin && (
          <AdminConsole
            tenantName="SATEM Demo Enterprise"
            metrics={{
              totalTickets: tickets.length,
              openTickets: tickets.filter((t) => t.status === 'OPEN' || t.status === 'NEW').length,
              mtfrMinutes: 28,
              mttrMinutes: 145,
              slaCompliancePct: 96.4,
              csatAverage: 4.8,
            }}
            policies={policies}
          />
        )}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};
