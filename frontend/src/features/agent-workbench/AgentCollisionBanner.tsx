import React from 'react';

export interface ViewerInfo {
  socketId: string;
  userId: string;
  fullName: string;
}

export interface AgentCollisionBannerProps {
  currentUserId: string;
  viewers: ViewerInfo[];
}

export const AgentCollisionBanner: React.FC<AgentCollisionBannerProps> = ({
  currentUserId,
  viewers,
}) => {
  const otherViewers = viewers.filter((v) => v.userId !== currentUserId);

  if (otherViewers.length === 0) {
    return null;
  }

  const names = otherViewers.map((v) => v.fullName).join(', ');

  return (
    <div
      style={{
        backgroundColor: '#fff1f0',
        border: '1px solid #ffa39e',
        borderRadius: '6px',
        padding: '10px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: '#cf1322',
        fontSize: '13px',
        fontWeight: 500,
        boxShadow: '0 2px 4px rgba(255, 77, 79, 0.1)',
      }}
      data-testid="agent-collision-banner"
    >
      <span style={{ fontSize: '18px' }}>⚠️</span>
      <div>
        <strong>Alerta de Colisión:</strong> {names}{' '}
        {otherViewers.length === 1 ? 'también está visualizando' : 'también están visualizando'} este ticket en tiempo real. 
        Evita responder en simultáneo para no duplicar esfuerzos.
      </div>
    </div>
  );
};
