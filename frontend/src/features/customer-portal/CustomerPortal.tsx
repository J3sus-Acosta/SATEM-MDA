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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      {/* Header Corporativo */}
      <header style={{ backgroundColor: '#0f172a', color: '#fff', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Portal de Ayuda — {tenantName}</h1>
        </div>
        <button
          type="button"
          onClick={() => setView(view === 'LIST' ? 'CREATE' : 'LIST')}
          style={{
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {view === 'LIST' ? '+ Abrir Nueva Solicitud' : '← Volver a Mis Solicitudes'}
        </button>
      </header>

      {/* Contenido Principal */}
      <main style={{ maxWidth: '1000px', margin: '32px auto', padding: '0 16px' }}>
        {view === 'CREATE' ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0, fontSize: '20px', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              Nueva Solicitud de Soporte
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Categoría del Requerimiento
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Asunto / Título Resumido
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: No puedo ingresar al módulo de remuneraciones"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Prioridad Estimada
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="LOW">Baja (Consultas generales)</option>
                  <option value="MEDIUM">Media (Afecta parcialmente mi trabajo)</option>
                  <option value="HIGH">Alta (Bloqueo importante de actividades)</option>
                  <option value="URGENT">Urgente (Servicio completamente caído)</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Descripción Detallada
                </label>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe los pasos para reproducir el problema o los antecedentes necesarios..."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setView('LIST')}
                  style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 24px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Enviar Ticket
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', color: '#1e293b', margin: 0 }}>Mis Solicitudes Activas</h2>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Mostrando {tickets.length} solicitudes</span>
            </div>

            {tickets.length === 0 ? (
              <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '48px', textAlign: 'center', color: '#64748b' }}>
                No tienes solicitudes abiertas en este momento.
              </div>
            ) : (
              <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onViewTicket(t.id)}
                    style={{
                      padding: '16px 24px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#2563eb' }}>{t.ticketCode}</span>
                        <span style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{t.title}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Creado: {t.createdAt} • Última actualización: {t.lastUpdate}
                      </div>
                    </div>
                    <div>
                      <span
                        style={{
                          backgroundColor: t.status === 'SOLVED' ? '#dcfce7' : '#e0e7ff',
                          color: t.status === 'SOLVED' ? '#166534' : '#3730a3',
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '4px 10px',
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
