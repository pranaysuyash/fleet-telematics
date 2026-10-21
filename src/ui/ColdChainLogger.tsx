import React from 'react';
import { ColdChainTelemetry } from '../engine/types';

interface ColdChainLoggerProps {
  coldChain: ColdChainTelemetry;
  onToggleDoor: () => void;
}

export const ColdChainLogger: React.FC<ColdChainLoggerProps> = ({ coldChain, onToggleDoor }) => {
  if (!coldChain.isEquipped) {
    return (
      <div className="telematics-card">
        <div className="card-header">
          <h3>❄️ Cold Chain Reefer Monitoring</h3>
          <span className="badge-gray">Dry Freight / Non-Refrigerated</span>
        </div>
        <p className="empty-notice">
          This vehicle is equipped with standard dry van or flatbed hardware. No active refrigeration unit detected on CAN bus network.
        </p>
      </div>
    );
  }

  const alertClass =
    coldChain.excursionAlert === 'critical'
      ? 'status-critical'
      : coldChain.excursionAlert === 'caution'
      ? 'status-caution'
      : 'status-normal';

  return (
    <div className="telematics-card coldchain-card">
      <div className="card-header">
        <div className="header-with-icon">
          <h3>❄️ Cold Chain Reefer Data Logger</h3>
          <span className={`status-pill ${alertClass}`}>
            {coldChain.excursionAlert.toUpperCase()}
          </span>
        </div>
        <button
          className={`btn-door-toggle ${coldChain.doorOpenState ? 'open' : 'closed'}`}
          onClick={onToggleDoor}
          title="Simulate opening or closing rear cargo doors to test temperature intrusion"
        >
          {coldChain.doorOpenState ? '🚪 Rear Doors: OPEN' : '🔒 Rear Doors: CLOSED'}
        </button>
      </div>

      <div className="coldchain-metrics-grid">
        <div className="coldchain-box">
          <span className="cc-lbl">SET POINT</span>
          <span className="cc-val">{coldChain.zone1SetPointF.toFixed(1)}°F</span>
          <span className="cc-sub">Target Temp</span>
        </div>

        <div className="coldchain-box">
          <span className="cc-lbl">INTERNAL TEMP</span>
          <span
            className="cc-val"
            style={{
              color:
                coldChain.excursionAlert === 'critical'
                  ? '#ef4444'
                  : coldChain.excursionAlert === 'caution'
                  ? '#f59e0b'
                  : '#10b981',
            }}
          >
            {coldChain.zone1CurrentTempF.toFixed(1)}°F
          </span>
          <span className="cc-sub">Zone 1 Cargo Sensor</span>
        </div>

        <div className="coldchain-box">
          <span className="cc-lbl">RETURN AIR</span>
          <span className="cc-val">{coldChain.zone1ReturnAirF.toFixed(1)}°F</span>
          <span className="cc-sub">Blower Duct Return</span>
        </div>

        <div className="coldchain-box">
          <span className="cc-lbl">REEFER FUEL</span>
          <span className="cc-val">{Math.round(coldChain.reeferFuelLevelPct)}%</span>
          <span className="cc-sub">50 Gal Dedicated Tank</span>
        </div>
      </div>

      {coldChain.doorOpenState && (
        <div className="alert-banner warning">
          ⚠️ <strong>DOOR AJAR WARNING:</strong> Cargo bay doors open. Thermal dissipation rate +0.15°F/sec active. Reefer compressor operating at 100% capacity to mitigate excursion.
        </div>
      )}

      {coldChain.excursionAlert === 'critical' && (
        <div className="alert-banner critical">
          🚨 <strong>FSMA TEMPERATURE EXCURSION CRITICAL:</strong> Cargo temperature has breached maximum allowable limit (+6°F over setpoint). Immediate carrier notification dispatched!
        </div>
      )}
    </div>
  );
};
