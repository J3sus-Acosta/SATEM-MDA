import React, { useState } from 'react';

export interface SlaPolicyItem {
  id: string;
  name: string;
  isDefault: boolean;
  targets: Array<{ priority: string; frtMins: number; resMins: number }>;
}

export interface AdminConsoleProps {
  tenantName: string;
  metrics: {
    totalTickets: number;
    openTickets: number;
    mtfrMinutes: number;
    mttrMinutes: number;
    slaCompliancePct: number;
    csatAverage: number;
  };
  policies: SlaPolicyItem[];
  onSavePolicy?: (policy: SlaPolicyItem) => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  tenantName,
  metrics,
  policies,
}) => {
  const [activeTab, setActiveTab] = useState<'METRICS' | 'SLA' | 'WORKFLOWS' | 'USERS'>('METRICS');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Header */}
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
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
            Consola de Administración - {tenantName}
          </h1>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Configuración Global y Métricas Operativas SATEM</span>
        </div>
      </header>

      {/* Navegación de Pestañas */}
      <div
        style={{
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          padding: '0 32px',
          display: 'flex',
          gap: '24px',
        }}
      >
        {[
          { id: 'METRICS', label: '📊 Tablero de Métricas & CSAT' },
          { id: 'SLA', label: '⏱️ Políticas de SLA y Horarios' },
          { id: 'WORKFLOWS', label: '⚡ Reglas de Automatización' },
          { id: 'USERS', label: '👥 Usuarios y Roles RBAC' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '14px 4px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #00a896' : '3px solid transparent',
              color: activeTab === tab.id ? '#00a896' : '#94a3b8',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '13.5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido Principal */}
      <main style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 16px' }}>
        {activeTab === 'METRICS' && (
          <div>
            <h2 style={{ fontSize: '18px', fontFamily: "'Outfit', sans-serif", color: '#f8fafc', marginBottom: '20px' }}>
              Resumen de Desempeño Operativo
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div
                style={{
                  background: '#1e293b',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                  transition: 'transform 0.2s',
                }}
              >
                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '8px' }}>
                  Volumen Total Tickets
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: '#f8fafc' }}>
                  {metrics.totalTickets}
                </div>
                <div style={{ fontSize: '12px', color: '#10b981', marginTop: '6px' }}>{metrics.openTickets} actualmente abiertos</div>
              </div>

              <div
                style={{
                  background: '#1e293b',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                }}
              >
                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '8px' }}>
                  Tiempo Medio 1ra Respuesta (MTFR)
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: '#00a896' }}>
                  {metrics.mtfrMinutes}m
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Dentro de objetivos</div>
              </div>

              <div
                style={{
                  background: '#1e293b',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                }}
              >
                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '8px' }}>
                  Tiempo Medio Resolución (MTTR)
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: '#38bdf8' }}>
                  {metrics.mttrMinutes}m
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Promedio ciclo completo</div>
              </div>

              <div
                style={{
                  background: '#1e293b',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                }}
              >
                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '8px' }}>
                  Cumplimiento de SLA
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: metrics.slaCompliancePct >= 90 ? '#10b981' : '#f59e0b' }}>
                  {metrics.slaCompliancePct}%
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Meta corporativa: ≥ 90%</div>
              </div>

              <div
                style={{
                  background: '#1e293b',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                }}
              >
                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '8px' }}>
                  Satisfacción Cliente (CSAT)
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: '#f59e0b' }}>
                  ★ {metrics.csatAverage.toFixed(1)} / 5.0
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Basado en encuestas de cierre</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'SLA' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontFamily: "'Outfit', sans-serif", color: '#f8fafc', margin: 0 }}>
                Políticas de Nivel de Servicio (SLA)
              </h2>
              <button
                type="button"
                style={{
                  background: '#00a896',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(0, 168, 150, 0.25)',
                }}
              >
                + Nueva Política SLA
              </button>
            </div>

            <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', overflow: 'hidden', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)' }}>
              {policies.map((p) => (
                <div key={p.id} style={{ padding: '20px 24px', borderBottom: '1px solid #334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: '#f8fafc' }}>{p.name}</span>
                    {p.isDefault && (
                      <span
                        style={{
                          backgroundColor: 'rgba(0, 168, 150, 0.15)',
                          color: '#00a896',
                          border: '1px solid #00a896',
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontWeight: 600,
                        }}
                      >
                        Por Defecto
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', backgroundColor: '#0f172a', padding: '12px', borderRadius: '6px', border: '1px solid #334155' }}>
                    {p.targets.map((t, idx) => (
                      <div key={idx} style={{ fontSize: '12px' }}>
                        <strong style={{ color: '#00a896' }}>{t.priority}:</strong> 1ra Resp: {t.frtMins}m | Resol: {t.resMins}m
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'WORKFLOWS' && (
          <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '36px', textAlign: 'center', color: '#94a3b8', border: '1px solid #334155' }}>
            Motor de Workflows activo. 3 reglas de enrutamiento y balanceo Round-Robin configuradas.
          </div>
        )}

        {activeTab === 'USERS' && (
          <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '36px', textAlign: 'center', color: '#94a3b8', border: '1px solid #334155' }}>
            Control de usuarios y matriz de permisos RBAC sincronizada.
          </div>
        )}
      </main>
    </div>
  );
};
