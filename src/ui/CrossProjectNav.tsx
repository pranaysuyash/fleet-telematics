import React from 'react';

export const CrossProjectNav: React.FC = () => {
  return (
    <header className="bridge-nav-header">
      <div className="bridge-nav-left">
        <span className="platform-tag">SAE J1939 CAN-BUS</span>
        <h1 className="brand-title">Product 05 — Telematics &amp; Real-Time Fleet Tracking HUD</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
          CAN-Bus Sensor Stream Live
        </span>
      </div>
    </header>
  );
};
