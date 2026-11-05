import React, { useState, useMemo } from 'react';
import {
  generateBaseline18WheelTpms,
  auditTpmsSafety,
  executeRemoteReeferCommand,
  INITIAL_REEFER_STATE,
  WheelPosition,
  ReeferUnitState,
  ReeferCommand,
} from '../engine/tpmsReeferControl';

interface TpmsAndRemoteReeferModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleUnit?: string;
}

export const TpmsAndRemoteReeferModal: React.FC<TpmsAndRemoteReeferModalProps> = ({
  isOpen,
  onClose,
  vehicleUnit = 'UNIT #1042',
}) => {
  const [wheels, setWheels] = useState<WheelPosition[]>(() =>
    generateBaseline18WheelTpms({
      'W-03': { psi: 82, tempF: 128 }, // Low pressure drive tire
    })
  );

  const [reeferState, setReeferState] = useState<ReeferUnitState>(INITIAL_REEFER_STATE);
  const [commandLog, setCommandLog] = useState<ReeferCommand[]>([]);
  const [targetSetpointInput, setTargetSetpointInput] = useState<number>(-10.0);

  const audit = useMemo(() => auditTpmsSafety(wheels), [wheels]);

  const handleSimulatePuncture = (wheelId: string) => {
    setWheels((prev) =>
      prev.map((w) =>
        w.id === wheelId
          ? {
              ...w,
              actualPsi: 68,
              actualTempF: 145,
              status: 'CRITICAL_DEFLATION',
            }
          : w
      )
    );
  };

  const handleSimulateOverheat = (wheelId: string) => {
    setWheels((prev) =>
      prev.map((w) =>
        w.id === wheelId
          ? {
              ...w,
              actualTempF: 195,
              status: 'OVERHEATING_BEARING',
            }
          : w
      )
    );
  };

  const handleResetTires = () => {
    setWheels(generateBaseline18WheelTpms());
  };

  const handleSendCommand = (commandType: ReeferCommand['commandType'], val: string | number) => {
    const { nextState, command } = executeRemoteReeferCommand(reeferState, commandType, val);
    setReeferState(nextState);
    setCommandLog((prev) => [command, ...prev]);
  };

  if (!isOpen) return null;

  return (
    <div
      className="camera-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tpms-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="camera-modal-content"
        style={{
          maxWidth: 820,
          background: '#0f172a',
          color: '#f8fafc',
          border: '1px solid #334155',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            background: '#1e293b',
            borderBottom: '1px solid #334155',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 id="tpms-modal-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              🛞 18-Wheel TPMS &amp; Bidirectional Remote Reefer Telematics
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Live wheel-end sensor telemetry &amp; remote commands for {vehicleUnit}.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '4px 8px',
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px', maxHeight: '74vh', overflowY: 'auto' }}>
          {/* TPMS Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#38bdf8' }}>
              18-Wheel Commercial Tire Pressure &amp; Bearing Temperature Telemetry:
            </h4>
            <button
              type="button"
              onClick={handleResetTires}
              style={{
                padding: '4px 8px',
                background: '#334155',
                color: '#f8fafc',
                border: 'none',
                borderRadius: 4,
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Reset All Tires to Spec (100–110 PSI)
            </button>
          </div>

          {audit.severeAlerts.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {audit.severeAlerts.map((alt, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    marginBottom: 4,
                    background: 'rgba(239, 68, 68, 0.2)',
                    borderLeft: '4px solid #ef4444',
                    color: '#fca5a5',
                  }}
                >
                  <strong>⚠️ Critical Wheel Exception:</strong> {alt}
                </div>
              ))}
            </div>
          )}

          {/* 18-Wheel Grid Display */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 20 }}>
            {wheels.map((w) => {
              const isCrit = w.status === 'CRITICAL_DEFLATION';
              const isHeat = w.status === 'OVERHEATING_BEARING';
              const isLow = w.status === 'LOW_PRESSURE';

              return (
                <div
                  key={w.id}
                  style={{
                    background: isCrit
                      ? 'rgba(239, 68, 68, 0.2)'
                      : isHeat
                      ? 'rgba(168, 85, 247, 0.2)'
                      : isLow
                      ? 'rgba(245, 158, 11, 0.2)'
                      : '#1e293b',
                    border: `1px solid ${
                      isCrit ? '#ef4444' : isHeat ? '#a855f7' : isLow ? '#f59e0b' : '#334155'
                    }`,
                    borderRadius: 6,
                    padding: '8px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {w.label}
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, margin: '2px 0', color: isCrit ? '#f87171' : isLow ? '#fbbf24' : '#38bdf8' }}>
                    {w.actualPsi} <span style={{ fontSize: '0.65rem' }}>PSI</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: isHeat ? '#d8b4fe' : '#cbd5e1' }}>
                    {w.actualTempF}°F {isHeat && '🔥'}
                  </div>

                  <div style={{ marginTop: 6, display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button
                      type="button"
                      title="Simulate Flat / Puncture"
                      onClick={() => handleSimulatePuncture(w.id)}
                      style={{ fontSize: '0.65rem', background: '#334155', border: 'none', borderRadius: 2, padding: '2px 4px', cursor: 'pointer', color: '#f87171' }}
                    >
                      Leak
                    </button>
                    <button
                      type="button"
                      title="Simulate Bearing Overheat"
                      onClick={() => handleSimulateOverheat(w.id)}
                      style={{ fontSize: '0.65rem', background: '#334155', border: 'none', borderRadius: 2, padding: '2px 4px', cursor: 'pointer', color: '#d8b4fe' }}
                    >
                      Heat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bidirectional Remote Reefer Console */}
          <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#38bdf8' }}>
            ❄️ Bidirectional Remote Reefer Telematics Control (Cellular / Satcom Gateway):
          </h4>

          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{reeferState.unitModel}</strong>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Operating Mode: <span style={{ color: '#38bdf8', fontWeight: 600 }}>{reeferState.runMode}</span> · Status:{' '}
                  <span style={{ color: reeferState.powerState === 'DEFROST' ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
                    {reeferState.powerState}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Fuel: {reeferState.fuelLevelPct}% · Engine: {reeferState.engineHours} hrs</div>
                <div style={{ fontSize: '0.75rem', color: '#4ade80' }}>Return Air: {reeferState.returnAirTempF}°F</div>
              </div>
            </div>

            {/* Remote Command Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 10, background: '#0f172a', padding: 12, borderRadius: 6 }}>
              {/* Setpoint update */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: 4 }}>
                  Remote Microprocessor Setpoint:
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="number"
                    step={0.5}
                    min={-20}
                    max={65}
                    value={targetSetpointInput}
                    onChange={(e) => setTargetSetpointInput(Number(e.target.value))}
                    style={{ width: 70, background: '#1e293b', color: '#f8fafc', border: '1px solid #475569', borderRadius: 4, padding: '4px 8px', fontSize: '0.8rem' }}
                  />
                  <span style={{ alignSelf: 'center', fontSize: '0.8rem', color: '#cbd5e1' }}>°F</span>
                  <button
                    type="button"
                    onClick={() => handleSendCommand('SET_SETPOINT', targetSetpointInput)}
                    style={{
                      padding: '4px 8px',
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Transmit
                  </button>
                </div>
              </div>

              {/* Defrost Action */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <button
                  type="button"
                  disabled={reeferState.powerState === 'DEFROST'}
                  onClick={() => handleSendCommand('TRIGGER_DEFROST', 0)}
                  style={{
                    padding: '8px 12px',
                    background: reeferState.powerState === 'DEFROST' ? '#475569' : '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: reeferState.powerState === 'DEFROST' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {reeferState.powerState === 'DEFROST' ? 'Defrost Active ♨️' : 'Trigger Defrost Cycle ♨️'}
                </button>
              </div>

              {/* Run Mode Toggle */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() =>
                    handleSendCommand(
                      'SET_RUN_MODE',
                      reeferState.runMode === 'CONTINUOUS' ? 'CYCLE_SENTRY' : 'CONTINUOUS'
                    )
                  }
                  style={{
                    padding: '8px 12px',
                    background: '#334155',
                    color: '#38bdf8',
                    border: '1px solid #475569',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Mode: {reeferState.runMode === 'CONTINUOUS' ? 'Continuous 🔄' : 'Start-Stop ⚡'}
                </button>
              </div>
            </div>
          </div>

          {/* Command History Feed */}
          {commandLog.length > 0 && (
            <div>
              <h5 style={{ margin: '0 0 6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                Over-the-Air Command Audit Log:
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {commandLog.slice(0, 3).map((cmd) => (
                  <div
                    key={cmd.id}
                    style={{
                      background: '#1e293b',
                      borderRadius: 4,
                      padding: '6px 10px',
                      fontSize: '0.7rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderLeft: '3px solid #22c55e',
                    }}
                  >
                    <span>
                      <strong>[{cmd.commandType}]</strong> {cmd.responseMessage}
                    </span>
                    <span style={{ color: '#64748b' }}>{cmd.dispatchedAt.split('T')[1].slice(0, 8)} UTC</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            background: '#1e293b',
            borderTop: '1px solid #334155',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 6,
              border: 'none',
              background: '#0284c7',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
