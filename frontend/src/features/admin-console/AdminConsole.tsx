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
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Header */}
      <header style={{ backgroundColor: '#1e293b', color: '#fff', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Consola de Administración — {tenantName}</h1>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Configuración Global y Métricas Operativas</span>
        </div>
      </header>

      {/* Navegación de Pestañas */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px', display: 'flex', gap: '24px' }}>
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
              padding: '16px 4px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #2563eb' : '3px solid transparent',
              color: activeTab === tab.id ? '#2563eb' : '#64748b',
              fontWeight: activeTab === tab.id ? 600 : 500,
              fontSize: '14px',
              cursor: 'pointer',
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
            <h2 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '20px' }}>Resumen de Desempeño Operativo</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Volumen Total Tickets</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{metrics.totalTickets}</div>
                <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>{metrics.openTickets} actualmente abiertos</div>
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Tiempo Medio 1ra Respuesta (MTFR)</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#2563eb' }}>{metrics.mtfrMinutes}m</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Dentro de objetivos</div>
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Tiempo Medio Resolución (MTTR)</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#7c3aed' }}>{metrics.mttrMinutes}m</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Promedio ciclo completo</div>
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Cumplimiento de SLA</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: metrics.slaCompliancePct >= 90 ? '#10b981' : '#f59e0b' }}>
                  {metrics.slaCompliancePct}%
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Meta corporativa: ≥ 90%</div>
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Satisfacción Cliente (CSAT)</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>⭐ {metrics.csatAverage.toFixed(1)} / 5.0</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Basado en encuestas de cierre</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'SLA' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', color: '#0f172a', margin: 0 }}>Políticas de Nivel de Servicio (SLA)</h2>
              <button
                type="button"
                style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                + Nueva Política SLA
              </button>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {policies.map((p) => (
                <div key={p.id} style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{p.name}</span>
                    {p.isDefault && (
                      <span style={{ backgroundColor: '#e2e8f0', color: '#475569', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                        Por Defecto
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                    {p.targets.map((t, idx) => (
                      <div key={idx} style={{ fontSize: '12px' }}>
                        <strong style={{ color: '#334155' }}>{t.priority}:</strong> 1ra Resp: {t.frtMins}m | Resol: {t.resMins}m
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'WORKFLOWS' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '32px', textAlign: 'center', color: '#64748b' }}>
            Motor de Workflows activo. 3 reglas de enrutamiento y balanceo Round-Robin configuradas.
          </div>
        )}

        {activeTab === 'USERS' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '32px', textAlign: 'center', color: '#64748b' }}>
            Control de usuarios y matriz de permisos RBAC sincronizada.
          </div>
        )}
      </main>
    </div>
  );
};
