import { describe, it, expect } from 'vitest';
import {
  INITIAL_FLEET_VEHICLES,
} from '../src/engine/corridors';
import {
  stepTelematicsSimulation,
  injectHarshBrakingEvent,
  toggleReeferDoor,
  injectDiagnosticTroubleCode,
  clearDiagnosticTroubleCodes,
} from '../src/engine/telematics';
import {
  buildCargoFitTelematicsBridgeUrl,
  buildFreightPricingTelematicsBridgeUrl,
  buildHosPlannerTelematicsBridgeUrl,
  buildAssetStudioTelematicsBridgeUrl,
} from '../src/engine/bridges';

describe('Product 05 — Telematics & J1939 Engine Architecture', () => {
  it('initializes fleet roster with valid SAE J1939 engine telemetry', () => {
    expect(INITIAL_FLEET_VEHICLES.length).toBeGreaterThanOrEqual(3);
    for (const v of INITIAL_FLEET_VEHICLES) {
      expect(v.vehicleId).toBeTruthy();
      expect(v.vehicleUnitNumber).toBeTruthy();
      expect(v.vin.length).toBe(17); // Standard 17-char VIN
      expect(v.engine.engineCoolantTempF).toBeGreaterThan(160);
      expect(v.engine.engineOilPressurePsi).toBeGreaterThan(20);
      expect(v.engine.fuelLevelPct).toBeGreaterThan(0);
      expect(v.engine.fuelLevelPct).toBeLessThanOrEqual(100);
      expect(v.engine.defLevelPct).toBeGreaterThan(0);
      expect(v.engine.defLevelPct).toBeLessThanOrEqual(100);
    }
  });

  it('steps physics simulation: advances odometer, burns fuel, and interpolates GPS along corridor', () => {
    const unit104 = INITIAL_FLEET_VEHICLES[0];
    const initialOdo = unit104.engine.odometerMiles;
    const initialFuel = unit104.engine.fuelLevelPct;
    const initialMileMarker = unit104.gps.mileMarker;

    // Step 60 seconds of driving at ~66.8 mph
    const stepped = stepTelematicsSimulation(unit104, { deltaSeconds: 60, gradePct: 0 });

    expect(stepped.engine.odometerMiles).toBeGreaterThan(initialOdo);
    expect(stepped.engine.fuelLevelPct).toBeLessThan(initialFuel);
    expect(stepped.gps.mileMarker).toBeGreaterThan(initialMileMarker);
    expect(stepped.gps.latitude).toBeCloseTo(unit104.gps.latitude, 1);
    expect(stepped.gps.longitude).toBeCloseTo(unit104.gps.longitude, 1);
  });

  it('detects cold chain reefer thermal intrusion when doors are open and triggers excursion alerts', () => {
    const reefer = INITIAL_FLEET_VEHICLES[0];
    expect(reefer.coldChain.isEquipped).toBe(true);

    const doorOpenReefer = toggleReeferDoor(reefer);
    expect(doorOpenReefer.coldChain.doorOpenState).toBe(true);

    // Simulate 60 seconds with doors open: temp should rise and trigger alert
    const hotReefer = stepTelematicsSimulation(doorOpenReefer, { deltaSeconds: 60 });
    expect(hotReefer.coldChain.zone1CurrentTempF).toBeGreaterThan(reefer.coldChain.zone1CurrentTempF);
    expect(['caution', 'critical']).toContain(hotReefer.coldChain.excursionAlert);
  });

  it('injects harsh braking event and decrements driver safety score', () => {
    const truck = INITIAL_FLEET_VEHICLES[0];
    const initialHarshBrakes = truck.safety.harshBrakeCount;
    const initialScore = truck.driverSafetyScore;

    const braked = injectHarshBrakingEvent(truck);
    expect(braked.safety.harshBrakeCount).toBe(initialHarshBrakes + 1);
    expect(braked.driverSafetyScore).toBeLessThan(initialScore);
    expect(braked.engine.roadSpeedMph).toBeLessThan(truck.engine.roadSpeedMph);
  });

  it('manages SAE J1939 Diagnostic Trouble Codes (DTC) and recalculates overall vehicle health', () => {
    const truck = INITIAL_FLEET_VEHICLES[0];
    const initialHealth = truck.overallHealthScore;

    // Inject Red Stop Engine DTC (SPN 100 FMI 1)
    const withFault = injectDiagnosticTroubleCode(truck, {
      spn: 100,
      fmi: 1,
      description: 'Engine Oil Pressure Extremely Low',
      sourceAddress: 'Engine #1 (00)',
      severity: 'red_stop_engine',
      timestamp: new Date().toISOString(),
    });

    expect(withFault.safety.activeDtcCodes.length).toBe(1);

    // Recalculate health with simulation step
    const stepped = stepTelematicsSimulation(withFault, { deltaSeconds: 1 });
    expect(stepped.overallHealthScore).toBeLessThan(initialHealth);

    // Clear codes
    const cleared = clearDiagnosticTroubleCodes(stepped);
    expect(cleared.safety.activeDtcCodes.length).toBe(0);
  });

  it('generates cross-project telematics bridge deep links across Ports 5173, 5174, 5175, 5176', () => {
    const truck = INITIAL_FLEET_VEHICLES[0];

    const p01 = buildCargoFitTelematicsBridgeUrl(truck);
    expect(p01).toContain('http://localhost:5173/?');
    expect(p01).toContain('source=product-05-telematics');
    expect(p01).toContain(`unitNumber=${truck.vehicleUnitNumber}`);

    const p02 = buildFreightPricingTelematicsBridgeUrl(truck);
    expect(p02).toContain('http://localhost:5174/?');
    expect(p02).toContain(`actualMpg=${truck.engine.averageMpg}`);

    const p03 = buildHosPlannerTelematicsBridgeUrl(truck);
    expect(p03).toContain('http://localhost:5175/?');
    expect(p03).toContain(`driverId=${truck.driverId}`);
    expect(p03).toContain(`currentDutyStatus=${truck.driverHosState}`);

    const p04 = buildAssetStudioTelematicsBridgeUrl(truck);
    expect(p04).toContain('http://localhost:5176/?');
    expect(p04).toContain('vehicle=reefer-53');
  });
});
