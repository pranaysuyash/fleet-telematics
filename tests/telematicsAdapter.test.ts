import { describe, it, expect } from 'vitest';
import {
  ingestTelematicsPayload,
  ExternalTelematicsPayload,
} from '../src/engine/telematicsAdapter';

describe('SAE J1939 Telematics Webhook & Sensor Ingestion Adapter', () => {
  it('leaves missing readings and reefer health unknown', () => {
    const snapshot = ingestTelematicsPayload({ vehicleId: 'TRK-1', timestamp: '2026-10-30T12:00:00Z', location: { latitude: 1, longitude: 2, speedMph: 20, odometerMiles: 100 } });
    expect(snapshot.engineRpm).toBeNull();
    expect(snapshot.coolantTempF).toBeNull();
    expect(snapshot.reeferTempF).toBeNull();
    expect(snapshot.isReeferExcursion).toBeNull();
    expect(snapshot.highestAlertSeverity).toBe('UNKNOWN');
  });
  it('does not infer an excursion from a temperature without a declared setpoint', () => {
    const snapshot = ingestTelematicsPayload({ vehicleId: 'TRK-1', timestamp: '2026-10-30T12:00:00Z', location: { latitude: 1, longitude: 2, speedMph: 20, odometerMiles: 100 }, j1939Signals: { spn1081_reeferTempF: 34 }, dtcList: [] });
    expect(snapshot.reeferTempF).toBe(34);
    expect(snapshot.reeferSetpointF).toBeNull();
    expect(snapshot.isReeferExcursion).toBeNull();
    expect(snapshot.highestAlertSeverity).toBe('UNKNOWN');
  });
  it('correctly ingests nominal highway telematics payload without excursions', () => {
    const raw: ExternalTelematicsPayload = {
      vehicleId: 'TRK-104',
      vin: '1FUJGLDR5HL992810',
      timestamp: '2026-10-30T12:00:00Z',
      location: {
        latitude: 41.525,
        longitude: -88.081,
        speedMph: 64.8,
        odometerMiles: 142850,
      },
      j1939Signals: {
        spn190_engineRpm: 1250,
        spn84_wheelSpeedMph: 65.0,
        spn110_coolantTempF: 192.5,
        spn183_fuelRateGph: 7.8,
        spn96_fuelLevelPct: 82,
        spn1081_reeferTempF: -10.2,
      },
      dtcList: [],
    };

    const snapshot = ingestTelematicsPayload(raw, -10.0);
    expect(snapshot.vehicleId).toBe('TRK-104');
    expect(snapshot.speedMph).toBe(65.0);
    expect(snapshot.engineRpm).toBe(1250);
    expect(snapshot.coolantTempF).toBe(192.5);
    expect(snapshot.isReeferExcursion).toBe(false);
    expect(snapshot.highestAlertSeverity).toBe('NORMAL');
    expect(snapshot.activeDtcAlerts.length).toBe(0);
  });

  it('flags a temperature difference beyond the scenario threshold', () => {
    const raw: ExternalTelematicsPayload = {
      vehicleId: 'TRK-104',
      timestamp: '2026-10-30T12:15:00Z',
      location: {
        latitude: 41.525,
        longitude: -88.081,
        speedMph: 60.0,
        odometerMiles: 142865,
      },
      j1939Signals: {
        spn1081_reeferTempF: -4.5, // 5.5°F above -10.0°F setpoint!
      },
    };

    const snapshot = ingestTelematicsPayload(raw, -10.0);
    expect(snapshot.isReeferExcursion).toBe(true);
    expect(snapshot.highestAlertSeverity).toBe('WARNING');
  });

  it('elevates severity to CRITICAL on RED_STOP_ENGINE DTC code', () => {
    const raw: ExternalTelematicsPayload = {
      vehicleId: 'TRK-209',
      timestamp: '2026-10-30T12:30:00Z',
      location: {
        latitude: 41.525,
        longitude: -88.081,
        speedMph: 45.0,
        odometerMiles: 89000,
      },
      dtcList: [
        {
          spn: 111,
          fmi: 1,
          description: 'Engine Coolant Level Critically Low',
          lampStatus: 'RED_STOP_ENGINE',
        },
      ],
    };

    const snapshot = ingestTelematicsPayload(raw);
    expect(snapshot.highestAlertSeverity).toBe('CRITICAL');
    expect(snapshot.activeDtcAlerts.length).toBe(1);
    expect(snapshot.activeDtcAlerts[0]).toContain('RED_STOP_ENGINE');
  });
});
