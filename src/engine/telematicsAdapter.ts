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
  engineRpm: number;
  coolantTempF: number;
  fuelRateGph: number;
  fuelLevelPct: number;
  reeferTempF: number;
  isReeferExcursion: boolean;
  reeferSetpointF: number;
  activeDtcAlerts: string[];
  highestAlertSeverity: 'NORMAL' | 'WARNING' | 'CRITICAL';
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
  reeferSetpointF = DEFAULT_REEFER_SETPOINT_F
): IngestedTelemetrySnapshot {
  const speed = raw.j1939Signals?.spn84_wheelSpeedMph ?? raw.location.speedMph ?? 0;
  const rpm = raw.j1939Signals?.spn190_engineRpm ?? 0;
  const coolant = raw.j1939Signals?.spn110_coolantTempF ?? 185.0;
  const fuelRate = raw.j1939Signals?.spn183_fuelRateGph ?? 7.2;
  const fuelLevel = raw.j1939Signals?.spn96_fuelLevelPct ?? 85.0;
  const reeferTemp = raw.j1939Signals?.spn1081_reeferTempF ?? -9.8;

  // Evaluate thermal excursion
  const isReeferExcursion = Math.abs(reeferTemp - reeferSetpointF) > EXCURSION_THRESHOLD_DELTA_F;

  // Process DTC trouble codes
  const activeDtcAlerts: string[] = [];
  let highestAlertSeverity: IngestedTelemetrySnapshot['highestAlertSeverity'] = 'NORMAL';

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
    engineRpm: Math.round(rpm),
    coolantTempF: Math.round(coolant * 10) / 10,
    fuelRateGph: Math.round(fuelRate * 10) / 10,
    fuelLevelPct: Math.round(fuelLevel),
    reeferTempF: Math.round(reeferTemp * 10) / 10,
    isReeferExcursion,
    reeferSetpointF,
    activeDtcAlerts,
    highestAlertSeverity,
  };
}
