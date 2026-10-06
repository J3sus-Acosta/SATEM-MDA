import React, { useState } from 'react';

export interface CustomerTicket {
  id: string;
  ticketCode: string;
  title: string;
  status: string;
  createdAt: string;
  lastUpdate: string;
}

export interface CustomerPortalProps {
  tenantName: string;
  tickets: CustomerTicket[];
  onCreateTicket: (ticket: { title: string; category: string; description: string; priority: string }) => void;
  onViewTicket: (ticketId: string) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  tenantName,
  tickets,
  onCreateTicket,
  onViewTicket,
}) => {
  const [view, setView] = useState<'LIST' | 'CREATE'>('LIST');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Sistemas y Software');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  const categories = [
    'Sistemas y Software',
    'Accesos, Cuentas y Contraseñas',
    'Hardware y Equipamiento',
    'Redes y Conectividad VPN',
    'Facturación y Pagos',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim()) {
      onCreateTicket({ title, category, description, priority });
      setTitle('');
      setDescription('');
      setView('LIST');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      {/* Header Corporativo */}
      <header
        style={{
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          color: '#f8fafc',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
            Portal de Ayuda - {tenantName}
          </h1>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Atención al Usuario &amp; Mesa de Ayuda SATEM</span>
        </div>
        <button
          type="button"
          onClick={() => setView(view === 'LIST' ? 'CREATE' : 'LIST')}
          style={{
            backgroundColor: '#00a896',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '9px 18px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 0 10px rgba(0, 168, 150, 0.25)',
            transition: 'background-color 0.15s ease',
          }}
        >
          {view === 'LIST' ? '+ Abrir Nueva Solicitud' : 'Volver a Mis Solicitudes'}
        </button>
      </header>

      {/* Contenido Principal */}
      <main style={{ maxWidth: '1000px', margin: '32px auto', padding: '0 16px' }}>
        {view === 'CREATE' ? (
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '32px', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}>
            <h2 style={{ marginTop: 0, fontSize: '20px', fontFamily: "'Outfit', sans-serif", color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              Nueva Solicitud de Soporte
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Categoría del Requerimiento
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', outline: 'none' }}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Asunto / Título Resumido
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: No puedo ingresar al módulo de remuneraciones"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Prioridad Estimada
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', outline: 'none' }}
                >
                  <option value="LOW">Baja (Consultas generales)</option>
                  <option value="MEDIUM">Media (Afecta parcialmente mi trabajo)</option>
                  <option value="HIGH">Alta (Bloqueo importante de actividades)</option>
                  <option value="URGENT">Urgente (Servicio completamente caído)</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Descripción Detallada
                </label>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe los pasos para reproducir el problema o los antecedentes necesarios..."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setView('LIST')}
                  style={{ padding: '9px 18px', borderRadius: '6px', border: '1px solid #475569', background: '#334155', color: '#f8fafc', cursor: 'pointer', fontWeight: 500 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 22px', borderRadius: '6px', border: 'none', background: '#00a896', color: '#ffffff', fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 10px rgba(0, 168, 150, 0.25)' }}
                >
                  Enviar Ticket
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontFamily: "'Outfit', sans-serif", color: '#f8fafc', margin: 0 }}>Mis Solicitudes Activas</h2>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Mostrando {tickets.length} solicitudes</span>
            </div>

            {tickets.length === 0 ? (
              <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '48px', textAlign: 'center', color: '#94a3b8', border: '1px solid #334155' }}>
                No tienes solicitudes abiertas en este momento.
              </div>
            ) : (
              <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', overflow: 'hidden', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)' }}>
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onViewTicket(t.id)}
                    style={{
                      padding: '16px 24px',
                      borderBottom: '1px solid #334155',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#00a896' }}>{t.ticketCode}</span>
                        <span style={{ fontWeight: 600, fontSize: '14px', color: '#f8fafc' }}>{t.title}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Creado: {t.createdAt} • Última actualización: {t.lastUpdate}
                      </div>
                    </div>
                    <div>
                      <span
                        style={{
                          backgroundColor: t.status === 'SOLVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 168, 150, 0.15)',
                          color: t.status === 'SOLVED' ? '#10b981' : '#00a896',
                          border: '1px solid ' + (t.status === 'SOLVED' ? '#10b981' : '#00a896'),
                          fontSize: '11.5px',
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: '9999px',
                        }}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
