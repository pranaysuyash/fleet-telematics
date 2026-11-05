import { describe, it, expect } from 'vitest';
import {
  generateBaseline18WheelTpms,
  auditTpmsSafety,
  executeRemoteReeferCommand,
  INITIAL_REEFER_STATE,
} from '../src/engine/tpmsReeferControl';

describe('Commercial 18-Wheel End TPMS & Bidirectional Remote Reefer Telematics', () => {
  it('generates 18 nominal wheel positions across steer, drive, and trailer tandems', () => {
    const wheels = generateBaseline18WheelTpms();
    expect(wheels.length).toBe(18);

    const steerLeft = wheels.find((w) => w.id === 'W-01');
    expect(steerLeft?.targetPsi).toBe(110);
    expect(steerLeft?.status).toBe('NORMAL');

    const audit = auditTpmsSafety(wheels);
    expect(audit.allTiresLegal).toBe(true);
    expect(audit.criticalDeflationsCount).toBe(0);
    expect(audit.overheatingBearingsCount).toBe(0);
  });

  it('detects critical deflation and overheating wheel-end bearings', () => {
    const anomalousWheels = generateBaseline18WheelTpms({
      'W-03': { psi: 68, tempF: 120 }, // Critical deflation (<80 PSI)
      'W-12': { psi: 99, tempF: 195 }, // Overheating bearing (>185°F)
    });

    const audit = auditTpmsSafety(anomalousWheels);
    expect(audit.allTiresLegal).toBe(false);
    expect(audit.criticalDeflationsCount).toBe(1);
    expect(audit.overheatingBearingsCount).toBe(1);
    expect(audit.severeAlerts.length).toBe(2);
  });

  it('executes bidirectional remote telematics commands to update reefer setpoint and mode', () => {
    const { nextState, command } = executeRemoteReeferCommand(
      INITIAL_REEFER_STATE,
      'SET_SETPOINT',
      -15.0
    );

    expect(nextState.setpointTempF).toBe(-15.0);
    expect(command.status).toBe('ACKNOWLEDGED');
    expect(command.responseMessage).toContain('-15.0°F');

    const defrostRes = executeRemoteReeferCommand(nextState, 'TRIGGER_DEFROST', 0);
    expect(defrostRes.nextState.powerState).toBe('DEFROST');
  });
});
