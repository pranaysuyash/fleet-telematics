import React from 'react';
import { DiagnosticTroubleCode, SafetyTelematicsEvents } from '../engine/types';

interface DtcAlertPanelProps {
  safety: SafetyTelematicsEvents;
  healthScore: number;
  driverScore: number;
  onClearCodes: () => void;
  onInjectCode: (code: DiagnosticTroubleCode) => void;
  onInjectHarshBrake: () => void;
}

export const DtcAlertPanel: React.FC<DtcAlertPanelProps> = ({
  safety,
  healthScore,
  driverScore,
  onClearCodes,
  onInjectCode,
  onInjectHarshBrake,
}) => {
  const codes = safety.activeDtcCodes;

  const handleSimulateLowCoolant = () => {
    onInjectCode({
      spn: 111,
      fmi: 1,
      description: 'Engine Coolant Level Low',
      sourceAddress: 'Engine #1 (00)',
      severity: 'amber_warning',
      timestamp: new Date().toISOString(),
    });
  };

  const handleSimulateStopEngine = () => {
    onInjectCode({
      spn: 100,
      fmi: 1,
      description: 'Engine Oil Pressure Extremely Low (Stop Engine)',
      sourceAddress: 'Engine #1 (00)',
      severity: 'red_stop_engine',
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="telematics-card dtc-card">
      <div className="card-header">
        <div className="header-with-icon">
          <h3>🚨 Active J1939 DTC Diagnostics & Safety Telematics</h3>
          <span className={`badge-dtc-count ${codes.length > 0 ? 'active' : 'clean'}`}>
            {codes.length} Active DTCs
          </span>
        </div>
        <div className="score-group">
          <div className="score-pill">
            <span className="sc-lbl">VEHICLE HEALTH:</span>
            <strong className="sc-val" style={{ color: healthScore < 80 ? '#ef4444' : '#10b981' }}>
              {healthScore} / 100
            </strong>
          </div>
          <div className="score-pill">
            <span className="sc-lbl">DRIVER SCORE:</span>
            <strong className="sc-val" style={{ color: driverScore < 80 ? '#ef4444' : '#10b981' }}>
              {driverScore} / 100
            </strong>
          </div>
        </div>
      </div>

      {/* Safety Events Counts */}
      <div className="safety-counters-row">
        <div className="counter-box">
          <span className="cnt-num">{safety.harshBrakeCount}</span>
          <span className="cnt-lbl">Harsh Braking (&gt;8.5 mph/s)</span>
        </div>
        <div className="counter-box">
          <span className="cnt-num">{safety.harshAccelCount}</span>
          <span className="cnt-lbl">Harsh Accelerations</span>
        </div>
        <div className="counter-box">
          <span className="cnt-num">{safety.harshCornerCount}</span>
          <span className="cnt-lbl">Harsh Cornering Events</span>
        </div>
        <div className="counter-box">
          <span className="cnt-num">{Math.round(safety.excessIdleMinutes)}m</span>
          <span className="cnt-lbl">Excess Stationary Idle</span>
        </div>
      </div>

      {/* DTC List */}
      <div className="dtc-table-container">
        {codes.length === 0 ? (
          <div className="clean-dtc-message">
            ✅ No active SAE J1939 Diagnostic Trouble Codes. Engine & powertrain sensors operating within standard OEM nominal tolerances.
          </div>
        ) : (
          <table className="dtc-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>SPN</th>
                <th>FMI</th>
                <th>Fault Description</th>
                <th>ECU Source</th>
                <th>Logged At</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c, i) => (
                <tr key={i} className={`row-${c.severity}`}>
                  <td>
                    <span className={`severity-tag ${c.severity}`}>
                      {c.severity === 'red_stop_engine' ? 'STOP ENGINE' : 'CHECK ENGINE'}
                    </span>
                  </td>
                  <td><strong>{c.spn}</strong></td>
                  <td>{c.fmi}</td>
                  <td>{c.description}</td>
                  <td>{c.sourceAddress}</td>
                  <td>{new Date(c.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Diagnostic Fault Injection & Reset Actions */}
      <div className="diagnostic-actions-row">
        <span className="action-label">FAULT INJECTION TESTING:</span>
        <button className="btn-action-test" onClick={handleSimulateLowCoolant}>
          + Trigger Low Coolant (SPN 111)
        </button>
        <button className="btn-action-test red" onClick={handleSimulateStopEngine}>
          + Trigger Stop Engine (SPN 100)
        </button>
        <button className="btn-action-test amber" onClick={onInjectHarshBrake}>
          + Simulate Harsh Braking
        </button>
        {codes.length > 0 && (
          <button className="btn-action-clear" onClick={onClearCodes}>
            🧹 Clear All Active DTCs
          </button>
        )}
      </div>
    </div>
  );
};
