/**
 * Commercial 18-Wheel End TPMS (Tire Pressure Monitoring System) &
 * Bidirectional Remote Reefer Telematics Control Engine
 *
 * Models individual wheel sensor metrics (PSI, °F, bearing overheat)
 * across steer, drive tandems, and trailer tandems, alongside remote command
 * execution for refrigeration units (Thermo King / Carrier Transicold).
 */

export type AxlePosition = 'steer' | 'drive_front' | 'drive_rear' | 'trailer_front' | 'trailer_rear';

export interface WheelPosition {
  id: string;
  axle: AxlePosition;
  side: 'left' | 'right';
  dualPosition: 'single' | 'inner' | 'outer';
  label: string;
  targetPsi: number;
  actualPsi: number;
  actualTempF: number;
  status: 'NORMAL' | 'LOW_PRESSURE' | 'CRITICAL_DEFLATION' | 'OVERHEATING_BEARING';
}

export interface ReeferCommand {
  id: string;
  commandType: 'SET_SETPOINT' | 'TRIGGER_DEFROST' | 'SET_RUN_MODE';
  parameterValue: string | number;
  dispatchedAt: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'FAILED';
  responseMessage: string;
}

export interface ReeferUnitState {
  unitModel: string;
  powerState: 'RUNNING' | 'STANDBY' | 'DEFROST' | 'ALARM';
  runMode: 'CONTINUOUS' | 'CYCLE_SENTRY';
  setpointTempF: number;
  returnAirTempF: number;
  dischargeAirTempF: number;
  fuelLevelPct: number;
  engineHours: number;
  activeAlarms: string[];
}

export const INITIAL_REEFER_STATE: ReeferUnitState = {
  unitModel: 'Thermo King Precedent S-600 SmartPower',
  powerState: 'RUNNING',
  runMode: 'CONTINUOUS',
  setpointTempF: -10.0,
  returnAirTempF: -9.4,
  dischargeAirTempF: -13.2,
  fuelLevelPct: 84,
  engineHours: 4210,
  activeAlarms: [],
};

/**
 * Generates initial 18-wheel layout with optional anomaly overrides.
 */
export function generateBaseline18WheelTpms(
  anomalies?: Record<string, { psi: number; tempF: number }>
): WheelPosition[] {
  const wheels: WheelPosition[] = [
    // Steer Axle (2 tires, 110 PSI target)
    { id: 'W-01', axle: 'steer', side: 'left', dualPosition: 'single', label: 'Steer Left (Pos 1)', targetPsi: 110, actualPsi: 109, actualTempF: 115, status: 'NORMAL' },
    { id: 'W-02', axle: 'steer', side: 'right', dualPosition: 'single', label: 'Steer Right (Pos 2)', targetPsi: 110, actualPsi: 111, actualTempF: 118, status: 'NORMAL' },

    // Drive Front Tandem (4 tires, 100 PSI target)
    { id: 'W-03', axle: 'drive_front', side: 'left', dualPosition: 'outer', label: 'Drive F-L Outer (Pos 3)', targetPsi: 100, actualPsi: 101, actualTempF: 122, status: 'NORMAL' },
    { id: 'W-04', axle: 'drive_front', side: 'left', dualPosition: 'inner', label: 'Drive F-L Inner (Pos 4)', targetPsi: 100, actualPsi: 99, actualTempF: 125, status: 'NORMAL' },
    { id: 'W-05', axle: 'drive_front', side: 'right', dualPosition: 'inner', label: 'Drive F-R Inner (Pos 5)', targetPsi: 100, actualPsi: 100, actualTempF: 124, status: 'NORMAL' },
    { id: 'W-06', axle: 'drive_front', side: 'right', dualPosition: 'outer', label: 'Drive F-R Outer (Pos 6)', targetPsi: 100, actualPsi: 102, actualTempF: 121, status: 'NORMAL' },

    // Drive Rear Tandem (4 tires, 100 PSI target)
    { id: 'W-07', axle: 'drive_rear', side: 'left', dualPosition: 'outer', label: 'Drive R-L Outer (Pos 7)', targetPsi: 100, actualPsi: 98, actualTempF: 126, status: 'NORMAL' },
    { id: 'W-08', axle: 'drive_rear', side: 'left', dualPosition: 'inner', label: 'Drive R-L Inner (Pos 8)', targetPsi: 100, actualPsi: 100, actualTempF: 127, status: 'NORMAL' },
    { id: 'W-09', axle: 'drive_rear', side: 'right', dualPosition: 'inner', label: 'Drive R-R Inner (Pos 9)', targetPsi: 100, actualPsi: 99, actualTempF: 125, status: 'NORMAL' },
    { id: 'W-10', axle: 'drive_rear', side: 'right', dualPosition: 'outer', label: 'Drive R-R Outer (Pos 10)', targetPsi: 100, actualPsi: 101, actualTempF: 123, status: 'NORMAL' },

    // Trailer Front Tandem (4 tires, 100 PSI target)
    { id: 'W-11', axle: 'trailer_front', side: 'left', dualPosition: 'outer', label: 'Trailer F-L Outer (Pos 11)', targetPsi: 100, actualPsi: 99, actualTempF: 110, status: 'NORMAL' },
    { id: 'W-12', axle: 'trailer_front', side: 'left', dualPosition: 'inner', label: 'Trailer F-L Inner (Pos 12)', targetPsi: 100, actualPsi: 100, actualTempF: 112, status: 'NORMAL' },
    { id: 'W-13', axle: 'trailer_front', side: 'right', dualPosition: 'inner', label: 'Trailer F-R Inner (Pos 13)', targetPsi: 100, actualPsi: 101, actualTempF: 111, status: 'NORMAL' },
    { id: 'W-14', axle: 'trailer_front', side: 'right', dualPosition: 'outer', label: 'Trailer F-R Outer (Pos 14)', targetPsi: 100, actualPsi: 98, actualTempF: 109, status: 'NORMAL' },

    // Trailer Rear Tandem (4 tires, 100 PSI target)
    { id: 'W-15', axle: 'trailer_rear', side: 'left', dualPosition: 'outer', label: 'Trailer R-L Outer (Pos 15)', targetPsi: 100, actualPsi: 100, actualTempF: 114, status: 'NORMAL' },
    { id: 'W-16', axle: 'trailer_rear', side: 'left', dualPosition: 'inner', label: 'Trailer R-L Inner (Pos 16)', targetPsi: 100, actualPsi: 99, actualTempF: 115, status: 'NORMAL' },
    { id: 'W-17', axle: 'trailer_rear', side: 'right', dualPosition: 'inner', label: 'Trailer R-R Inner (Pos 17)', targetPsi: 100, actualPsi: 101, actualTempF: 113, status: 'NORMAL' },
    { id: 'W-18', axle: 'trailer_rear', side: 'right', dualPosition: 'outer', label: 'Trailer R-R Outer (Pos 18)', targetPsi: 100, actualPsi: 100, actualTempF: 112, status: 'NORMAL' },
  ];

  // Apply anomalies
  if (anomalies) {
    for (const w of wheels) {
      if (anomalies[w.id]) {
        w.actualPsi = anomalies[w.id].psi;
        w.actualTempF = anomalies[w.id].tempF;
      }
    }
  }

  // Evaluate statuses
  for (const w of wheels) {
    if (w.actualTempF >= 185) {
      w.status = 'OVERHEATING_BEARING';
    } else if (w.actualPsi < w.targetPsi * 0.8) {
      w.status = 'CRITICAL_DEFLATION';
    } else if (w.actualPsi < w.targetPsi * 0.9) {
      w.status = 'LOW_PRESSURE';
    } else {
      w.status = 'NORMAL';
    }
  }

  return wheels;
}

export interface TpmsAuditSummary {
  totalWheelsCount: number;
  criticalDeflationsCount: number;
  lowPressureCount: number;
  overheatingBearingsCount: number;
  allTiresLegal: boolean;
  severeAlerts: string[];
}

/**
 * Audits 18-wheel TPMS status against CVSA Out-of-Service inspection criteria.
 */
export function auditTpmsSafety(wheels: WheelPosition[]): TpmsAuditSummary {
  const severeAlerts: string[] = [];
  let criticalDeflationsCount = 0;
  let lowPressureCount = 0;
  let overheatingBearingsCount = 0;

  for (const w of wheels) {
    if (w.status === 'CRITICAL_DEFLATION') {
      criticalDeflationsCount++;
      severeAlerts.push(`Critical Deflation on ${w.label}: ${w.actualPsi} PSI (Spec: ${w.targetPsi} PSI). High blowout risk!`);
    } else if (w.status === 'OVERHEATING_BEARING') {
      overheatingBearingsCount++;
      severeAlerts.push(`Overheating Wheel-End on ${w.label}: ${w.actualTempF}°F. Probable wheel bearing seizure!`);
    } else if (w.status === 'LOW_PRESSURE') {
      lowPressureCount++;
    }
  }

  return {
    totalWheelsCount: wheels.length,
    criticalDeflationsCount,
    lowPressureCount,
    overheatingBearingsCount,
    allTiresLegal: criticalDeflationsCount === 0 && overheatingBearingsCount === 0,
    severeAlerts,
  };
}

/**
 * Dispatches a bidirectional remote telematics command to the Carrier/ThermoKing controller.
 */
export function executeRemoteReeferCommand(
  currentState: ReeferUnitState,
  commandType: ReeferCommand['commandType'],
  parameterValue: string | number
): { nextState: ReeferUnitState; command: ReeferCommand } {
  const cmdId = `CMD-${Date.now().toString(36).toUpperCase()}`;
  const timestamp = new Date().toISOString();

  const nextState: ReeferUnitState = { ...currentState };
  let responseMessage = 'Command executed successfully by remote telematics gateway.';

  if (commandType === 'SET_SETPOINT') {
    const newTemp = Number(parameterValue);
    nextState.setpointTempF = newTemp;
    responseMessage = `Microprocessor setpoint successfully updated to ${newTemp.toFixed(1)}°F. Compressor adjusting modulation.`;
  } else if (commandType === 'TRIGGER_DEFROST') {
    nextState.powerState = 'DEFROST';
    responseMessage = 'Hot gas reverse defrost initiated. Evaporator coil heaters engaged for 20-minute cycle.';
  } else if (commandType === 'SET_RUN_MODE') {
    const mode = parameterValue as 'CONTINUOUS' | 'CYCLE_SENTRY';
    nextState.runMode = mode;
    responseMessage = `Engine cycle mode switched to ${mode}. Auto start-stop parameters updated.`;
  }

  const command: ReeferCommand = {
    id: cmdId,
    commandType,
    parameterValue,
    dispatchedAt: timestamp,
    status: 'ACKNOWLEDGED',
    responseMessage,
  };

  return { nextState, command };
}
