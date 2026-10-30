import React, { useState } from 'react';
import { IconSnowflake } from './icons';
import { ColdChainTelemetry } from '../engine/types';

interface ColdChainLoggerProps {
  coldChain: ColdChainTelemetry;
  onToggleDoor: () => void;
  onUpdateSettings?: (settings: {
    setPointF?: number;
    compressorMode?: 'continuous' | 'start_stop';
  }) => void;
}

export const ColdChainLogger: React.FC<ColdChainLoggerProps> = ({
  coldChain,
  onToggleDoor,
  onUpdateSettings,
}) => {
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);

  if (!coldChain.isEquipped) {
    return (
      <div className="telematics-card">
        <div className="card-header">
          <h3>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <IconSnowflake size={16} /> Cold Chain Reefer Monitoring
            </span>
          </h3>
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

  const handleApplyPreset = (targetF: number, label: string) => {
    if (onUpdateSettings) {
      onUpdateSettings({ setPointF: targetF });
      setCommandFeedback(`Two-Way CAN Command Acknowledged: Set Point commanded to ${targetF}°F (${label})`);
      setTimeout(() => setCommandFeedback(null), 3500);
    }
  };

  const handleAdjustTemp = (deltaF: number) => {
    if (onUpdateSettings) {
      const newTemp = Math.round((coldChain.zone1SetPointF + deltaF) * 10) / 10;
      onUpdateSettings({ setPointF: newTemp });
      setCommandFeedback(`Set Point adjusted to ${newTemp}°F`);
      setTimeout(() => setCommandFeedback(null), 3500);
    }
  };

  const handleToggleMode = () => {
    if (onUpdateSettings) {
      const nextMode = coldChain.compressorMode === 'continuous' ? 'start_stop' : 'continuous';
      onUpdateSettings({ compressorMode: nextMode });
      setCommandFeedback(`Compressor Mode switched to ${nextMode === 'continuous' ? 'Continuous Run' : 'Cycle Sentry (Start/Stop)'}`);
      setTimeout(() => setCommandFeedback(null), 3500);
    }
  };

  return (
    <div className="telematics-card coldchain-card">
      <div className="card-header">
        <div className="header-with-icon">
          <h3>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <IconSnowflake size={16} /> Cold Chain Reefer Data Logger
            </span>
          </h3>
          <span className={`status-pill ${alertClass}`}>
            {coldChain.excursionAlert.toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className={`btn-door-toggle ${coldChain.doorOpenState ? 'open' : 'closed'}`}
            onClick={onToggleDoor}
            title="Simulate opening or closing rear cargo doors to test temperature intrusion"
          >
            {coldChain.doorOpenState ? 'Rear Doors: OPEN' : 'Rear Doors: CLOSED'}
          </button>
        </div>
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

      {/* Two-Way Remote IoT Reefer Controls */}
      {onUpdateSettings && (
        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          background: 'rgba(2, 132, 199, 0.05)',
          borderRadius: 8,
          border: '1px solid rgba(2, 132, 199, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Two-Way Remote Reefer IoT Commands
            </span>
            <button
              onClick={handleToggleMode}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 4,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                cursor: 'pointer',
                color: '#334155',
              }}
            >
              Mode: {coldChain.compressorMode === 'continuous' ? 'Continuous (Heavy Cold)' : 'Cycle Sentry (Fuel Save)'}
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Presets:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset(-10.0, 'Frozen Meat & Ice Cream')}
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 4,
                background: Math.abs(coldChain.zone1SetPointF - (-10)) < 0.5 ? '#0284c7' : '#ffffff',
                color: Math.abs(coldChain.zone1SetPointF - (-10)) < 0.5 ? '#ffffff' : '#0369a1',
                border: '1px solid #0284c7',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              -10°F Deep Freeze
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset(34.0, 'Fresh Dairy & Produce')}
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 4,
                background: Math.abs(coldChain.zone1SetPointF - 34) < 0.5 ? '#0284c7' : '#ffffff',
                color: Math.abs(coldChain.zone1SetPointF - 34) < 0.5 ? '#ffffff' : '#0369a1',
                border: '1px solid #0284c7',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              34°F Fresh Produce
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset(55.0, 'Confectionery & Ambient')}
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 4,
                background: Math.abs(coldChain.zone1SetPointF - 55) < 0.5 ? '#0284c7' : '#ffffff',
                color: Math.abs(coldChain.zone1SetPointF - 55) < 0.5 ? '#ffffff' : '#0369a1',
                border: '1px solid #0284c7',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              55°F Chocolate / Wine
            </button>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>Fine-tune:</span>
              <button
                type="button"
                onClick={() => handleAdjustTemp(-1)}
                style={{
                  fontSize: 11,
                  padding: '2px 7px',
                  borderRadius: 4,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                -1°F
              </button>
              <button
                type="button"
                onClick={() => handleAdjustTemp(1)}
                style={{
                  fontSize: 11,
                  padding: '2px 7px',
                  borderRadius: 4,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                +1°F
              </button>
            </div>
          </div>

          {commandFeedback && (
            <div style={{ fontSize: 11, color: '#0369a1', fontStyle: 'italic' }}>
              ✓ {commandFeedback}
            </div>
          )}
        </div>
      )}

      {coldChain.doorOpenState && (
        <div className="alert-banner warning" style={{ marginTop: 10 }}>
          <strong>DOOR AJAR WARNING:</strong> Cargo bay doors open. Thermal dissipation rate +0.15°F/sec active. Reefer compressor operating at 100% capacity to mitigate excursion.
        </div>
      )}

      {coldChain.excursionAlert === 'critical' && (
        <div className="alert-banner critical" style={{ marginTop: 10 }}>
          <strong>FSMA TEMPERATURE EXCURSION CRITICAL:</strong> Cargo temperature has breached maximum allowable limit (+6°F over setpoint). Simulated excursion alert logged locally (simulation).
        </div>
      )}
    </div>
  );
};
