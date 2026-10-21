import React from 'react';
import { J1939EngineTelemetry } from '../engine/types';

interface LiveGaugesProps {
  engine: J1939EngineTelemetry;
  operationalStatus: string;
}

export const LiveGauges: React.FC<LiveGaugesProps> = ({ engine, operationalStatus }) => {
  const speedPct = Math.min(100, (engine.roadSpeedMph / 85) * 100);
  const rpmPct = Math.min(100, (engine.engineRpm / 2200) * 100);

  // Coolant status
  let coolantColor = '#10b981'; // Green
  if (engine.engineCoolantTempF > 218) coolantColor = '#ef4444'; // Red
  else if (engine.engineCoolantTempF > 208) coolantColor = '#f59e0b'; // Amber

  // Oil pressure status
  let oilColor = '#10b981';
  if (engine.engineOilPressurePsi < 25) oilColor = '#ef4444';
  else if (engine.engineOilPressurePsi < 32) oilColor = '#f59e0b';

  return (
    <div className="telematics-card gauges-card">
      <div className="card-header">
        <h3>⚡ SAE J1939 CAN Bus Engine Telemetry</h3>
        <span className={`status-pill ${operationalStatus}`}>
          {operationalStatus.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="gauges-primary-grid">
        {/* Speedometer Gauge */}
        <div className="gauge-dial-box">
          <div className="gauge-circle-outer">
            <svg viewBox="0 0 100 100" className="gauge-svg">
              <circle cx="50" cy="50" r="42" className="gauge-bg-circle" />
              <circle
                cx="50"
                cy="50"
                r="42"
                className="gauge-progress-circle"
                style={{
                  strokeDasharray: '264',
                  strokeDashoffset: 264 - (264 * (speedPct * 0.75)) / 100,
                  stroke: engine.roadSpeedMph > 72 ? '#f59e0b' : '#38bdf8',
                }}
              />
            </svg>
            <div className="gauge-center-val">
              <span className="dial-num">{Math.round(engine.roadSpeedMph)}</span>
              <span className="dial-unit">MPH</span>
            </div>
          </div>
          <div className="gauge-label">VEHICLE SPEED</div>
          <div className="gauge-subtext">Cruise: {engine.cruiseControlActive ? 'ON' : 'OFF'} · Gear: {engine.transmissionGear || 'N'}</div>
        </div>

        {/* Tachometer RPM Gauge */}
        <div className="gauge-dial-box">
          <div className="gauge-circle-outer">
            <svg viewBox="0 0 100 100" className="gauge-svg">
              <circle cx="50" cy="50" r="42" className="gauge-bg-circle" />
              <circle
                cx="50"
                cy="50"
                r="42"
                className="gauge-progress-circle"
                style={{
                  strokeDasharray: '264',
                  strokeDashoffset: 264 - (264 * (rpmPct * 0.75)) / 100,
                  stroke: engine.engineRpm > 1800 ? '#ef4444' : '#10b981',
                }}
              />
            </svg>
            <div className="gauge-center-val">
              <span className="dial-num">{Math.round(engine.engineRpm)}</span>
              <span className="dial-unit">RPM</span>
            </div>
          </div>
          <div className="gauge-label">ENGINE TACHOMETER</div>
          <div className="gauge-subtext">Load: {Math.round(engine.engineLoadPct)}% · Throttle: {Math.round(engine.acceleratorPedalPct)}%</div>
        </div>

        {/* Secondary Gauges: Coolant, Oil, Fuel, DEF */}
        <div className="secondary-bars-column">
          {/* Coolant */}
          <div className="param-bar-item">
            <div className="param-label-row">
              <span>Coolant Temp</span>
              <strong style={{ color: coolantColor }}>{Math.round(engine.engineCoolantTempF)} °F</strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, ((engine.engineCoolantTempF - 140) / 100) * 100))}%`,
                  background: coolantColor,
                }}
              />
            </div>
          </div>

          {/* Oil Pressure */}
          <div className="param-bar-item">
            <div className="param-label-row">
              <span>Oil Pressure</span>
              <strong style={{ color: oilColor }}>{Math.round(engine.engineOilPressurePsi)} PSI</strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, (engine.engineOilPressurePsi / 80) * 100))}%`,
                  background: oilColor,
                }}
              />
            </div>
          </div>

          {/* Diesel Fuel Level */}
          <div className="param-bar-item">
            <div className="param-label-row">
              <span>Diesel Fuel Level</span>
              <strong style={{ color: engine.fuelLevelPct < 20 ? '#ef4444' : '#38bdf8' }}>
                {Math.round(engine.fuelLevelPct)}%
              </strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${engine.fuelLevelPct}%`,
                  background: engine.fuelLevelPct < 20 ? '#ef4444' : '#38bdf8',
                }}
              />
            </div>
          </div>

          {/* DEF Level */}
          <div className="param-bar-item">
            <div className="param-label-row">
              <span>DEF Fluid (Diesel Exhaust Fluid)</span>
              <strong style={{ color: engine.defLevelPct < 15 ? '#ef4444' : '#06b6d4' }}>
                {Math.round(engine.defLevelPct)}%
              </strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${engine.defLevelPct}%`,
                  background: engine.defLevelPct < 15 ? '#ef4444' : '#06b6d4',
                }}
              />
            </div>
          </div>

          {/* Instantaneous & Average MPG */}
          <div className="mpg-stat-row">
            <div className="stat-chip">
              <span className="stat-lbl">INSTANT MPG</span>
              <span className="stat-val">{engine.instantaneousMpg.toFixed(1)}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-lbl">AVG MPG</span>
              <span className="stat-val">{engine.averageMpg.toFixed(1)}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-lbl">BATTERY</span>
              <span className="stat-val">{engine.batteryVoltageV.toFixed(1)} V</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
