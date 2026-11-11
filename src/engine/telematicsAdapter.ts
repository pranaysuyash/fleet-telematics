/**
 * SAE J1939 CAN Bus & External Telematics Webhook Ingestion Adapter.
 * Translates raw broadcast parameters (SPNs) and telematics payloads (Samsara/Geotab/Motive)
 * into standardized domain telemetry snapshots and active DTC alerts.
 */

export interface ExternalTelematicsPayload {
  vehicleId: string;
  vin?: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
    speedMph: number;
    headingDeg?: number;
    odometerMiles: number;
  };
  j1939Signals?: {
    spn190_engineRpm?: number;
    spn84_wheelSpeedMph?: number;
    spn110_coolantTempF?: number;
    spn183_fuelRateGph?: number;
    spn96_fuelLevelPct?: number;
    spn1081_reeferTempF?: number;
  };
  dtcList?: Array<{
    spn: number;
    fmi: number; // Failure Mode Identifier (e.g. 0 = Data Valid Above Normal, 3 = Voltage Above Normal)
    description: string;
    lampStatus: 'MIL_CHECK_ENGINE' | 'AMBER_WARNING' | 'RED_STOP_ENGINE';
    occurrenceCount?: number;
  }>;
}

export interface IngestedTelemetrySnapshot {
  vehicleId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  speedMph: number;
  odometerMiles: number;
  engineRpm: number | null;
  coolantTempF: number | null;
  fuelRateGph: number | null;
  fuelLevelPct: number | null;
  reeferTempF: number | null;
  isReeferExcursion: boolean | null;
  reeferSetpointF: number | null;
  activeDtcAlerts: string[];
  highestAlertSeverity: 'UNKNOWN' | 'NORMAL' | 'WARNING' | 'CRITICAL';
}

/**
 * Standard reefer target setpoint (-10.0°F for frozen, 34.0°F for fresh produce).
 */
export const DEFAULT_REEFER_SETPOINT_F = -10.0;
export const EXCURSION_THRESHOLD_DELTA_F = 3.0; // +/- 3 degrees delta triggers excursion

/**
 * Parses and validates raw telematics feeds into standardized engine snapshots.
 */
export function ingestTelematicsPayload(
  raw: ExternalTelematicsPayload,
  reeferSetpointF?: number
): IngestedTelemetrySnapshot {
  const speed = raw.j1939Signals?.spn84_wheelSpeedMph ?? raw.location.speedMph ?? 0;
  const present = (value: number | undefined) => typeof value === 'number' && Number.isFinite(value) ? value : null;
  const rpm = present(raw.j1939Signals?.spn190_engineRpm);
  const coolant = present(raw.j1939Signals?.spn110_coolantTempF);
  const fuelRate = present(raw.j1939Signals?.spn183_fuelRateGph);
  const fuelLevel = present(raw.j1939Signals?.spn96_fuelLevelPct);
  const reeferTemp = present(raw.j1939Signals?.spn1081_reeferTempF);

  // Evaluate thermal excursion
  const declaredSetpoint = present(reeferSetpointF);
  const isReeferExcursion = reeferTemp === null || declaredSetpoint === null ? null : Math.abs(reeferTemp - declaredSetpoint) > EXCURSION_THRESHOLD_DELTA_F;

  // Process DTC trouble codes
  const activeDtcAlerts: string[] = [];
  let highestAlertSeverity: IngestedTelemetrySnapshot['highestAlertSeverity'] = raw.dtcList && isReeferExcursion !== null ? 'NORMAL' : 'UNKNOWN';

  if (raw.dtcList && raw.dtcList.length > 0) {
    for (const dtc of raw.dtcList) {
      activeDtcAlerts.push(`SPN ${dtc.spn} FMI ${dtc.fmi}: ${dtc.description} [${dtc.lampStatus}]`);
      if (dtc.lampStatus === 'RED_STOP_ENGINE') {
        highestAlertSeverity = 'CRITICAL';
      } else if (dtc.lampStatus === 'MIL_CHECK_ENGINE' || dtc.lampStatus === 'AMBER_WARNING') {
        if (highestAlertSeverity !== 'CRITICAL') {
          highestAlertSeverity = 'WARNING';
        }
      }
    }
  }

  if (isReeferExcursion && highestAlertSeverity !== 'CRITICAL') {
    highestAlertSeverity = 'WARNING';
  }

  return {
    vehicleId: raw.vehicleId || 'TRK-UNKNOWN',
    timestamp: raw.timestamp || new Date().toISOString(),
    latitude: raw.location.latitude,
    longitude: raw.location.longitude,
    speedMph: Math.round(speed * 10) / 10,
    odometerMiles: raw.location.odometerMiles,
    engineRpm: rpm === null ? null : Math.round(rpm),
    coolantTempF: coolant === null ? null : Math.round(coolant * 10) / 10,
    fuelRateGph: fuelRate === null ? null : Math.round(fuelRate * 10) / 10,
    fuelLevelPct: fuelLevel === null ? null : Math.round(fuelLevel),
    reeferTempF: reeferTemp === null ? null : Math.round(reeferTemp * 10) / 10,
    isReeferExcursion,
    reeferSetpointF: declaredSetpoint,
    activeDtcAlerts,
    highestAlertSeverity,
  };
}
