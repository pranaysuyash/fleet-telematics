import React from 'react';

export const CrossProjectNav: React.FC = () => {
  return (
    <header className="bridge-nav-header">
      <div className="bridge-nav-left">
        <span className="platform-tag">TRUCKING PLATFORM</span>
        <h1 className="brand-title">Product 05 — Telematics & Real-Time Fleet Tracking HUD</h1>
      </div>

      <div className="bridge-nav-links">
        <a href="http://localhost:5173" className="bridge-link" target="_blank" rel="noopener noreferrer">
          <span className="dot dot-p01" />
          P01 Cargo Fit (5173)
        </a>
        <a href="http://localhost:5174" className="bridge-link" target="_blank" rel="noopener noreferrer">
          <span className="dot dot-p02" />
          P02 Freight Pricing (5174)
        </a>
        <a href="http://localhost:5175" className="bridge-link" target="_blank" rel="noopener noreferrer">
          <span className="dot dot-p03" />
          P03 HOS Planner (5175)
        </a>
        <a href="http://localhost:5176" className="bridge-link" target="_blank" rel="noopener noreferrer">
          <span className="dot dot-p04" />
          P04 Asset Studio (5176)
        </a>
        <a href="http://localhost:5177" className="bridge-link active" target="_blank" rel="noopener noreferrer">
          <span className="dot dot-p05" />
          P05 Telematics HUD (5177)
        </a>
      </div>
    </header>
  );
};
