import React, { useState } from 'react';
import { useAuth, UserProfile } from '../../context/AuthContext';

export interface LoginViewProps {
  onSuccess?: (user: UserProfile) => void;
  onBypassDemo?: (role: 'ORG_ADMIN' | 'SUPPORT_AGENT' | 'REQUESTER') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onBypassDemo }) => {
  const { login, isLoading } = useAuth();

  const [tenant, setTenant] = useState('satem-demo');
  const [email, setEmail] = useState('admin@satem.cl');
  const [password, setPassword] = useState('SatemAdmin2026!');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = await login(email, password, tenant);
    if (result.success) {
      if (onSuccess) {
        // Obtenemos el usuario de la sesión
        const stored = sessionStorage.getItem('satem_helpdesk_user');
        if (stored) {
          onSuccess(JSON.parse(stored));
        }
      }
    } else {
      setErrorMessage(result.error || 'Credenciales inválidas.');
    }
  };

  const handleQuickSelect = (
    demoEmail: string,
    demoPass: string,
    role: 'ORG_ADMIN' | 'SUPPORT_AGENT' | 'REQUESTER',
    name: string
  ) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setTenant('satem-demo');
    setErrorMessage(null);

    // Si el usuario decide entrar en modo demostración directa
    if (onBypassDemo) {
      onBypassDemo(role);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#090d16',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, #1e293b 0%, #090d16 75%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#f8fafc',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(37, 99, 235, 0.1)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '22px',
              color: '#ffffff',
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.3)',
            }}
          >
            S
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>
            SATEM ONE
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
            Mesa de Ayuda & Service Desk Corporativo
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: '#450a0a',
              border: '1px solid #7f1d1d',
              color: '#fca5a5',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="tenant"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#cbd5e1' }}
            >
              Organización / Tenant
            </label>
            <input
              id="tenant"
              type="text"
              value={tenant}
              onChange={(e) => setTenant(e.target.value)}
              required
              placeholder="satem-demo o subdominio"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #334155',
                backgroundColor: '#1e293b',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="email"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#cbd5e1' }}
            >
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nombre@empresa.com"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #334155',
                backgroundColor: '#1e293b',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="password"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#cbd5e1' }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #334155',
                backgroundColor: '#1e293b',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'background-color 0.15s ease',
            }}
          >
            {isLoading ? 'Autenticando en SATEM...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Quick Demo Access Section */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #1e293b' }}>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#94a3b8', textAlign: 'center', fontWeight: 500 }}>
            Acceso Rápido para Pruebas Locales:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickSelect('admin@satem.cl', 'SatemAdmin2026!', 'ORG_ADMIN', 'Administrador SATEM')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#e2e8f0',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>👑 <strong>Administrador (OrgAdmin)</strong></span>
              <span style={{ color: '#38bdf8' }}>admin@satem.cl</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('agente.demo@satem.cl', 'Agente2026!', 'SUPPORT_AGENT', 'Patricio Soto')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#e2e8f0',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>🎧 <strong>Agente de Soporte N2</strong></span>
              <span style={{ color: '#38bdf8' }}>agente.demo@satem.cl</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('cliente.demo@satem.cl', 'Cliente2026!', 'REQUESTER', 'Carlos Sepúlveda')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#e2e8f0',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>🙋‍♂️ <strong>Cliente Solicitante</strong></span>
              <span style={{ color: '#38bdf8' }}>cliente.demo@satem.cl</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
