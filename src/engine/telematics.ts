/**
 * Real-time J1939 CAN bus telemetry physics, cold chain fluctuation,
 * and safety diagnostic engine.
 */

import {
  TelematicsVehicleSnapshot,
  DiagnosticTroubleCode,
} from './types';
import { CORRIDOR_I80 } from './corridors';

export interface TelematicsStepOptions {
  deltaSeconds: number;
  gradePct?: number; // Road grade: positive for uphill, negative for downhill
}

/**
 * Steps the vehicle simulation by deltaSeconds, applying realistic engine physics,
 * fuel consumption, cold-chain thermal decay, and corridor GPS waypoint interpolation.
 */
export function stepTelematicsSimulation(
  vehicle: TelematicsVehicleSnapshot,
  options: TelematicsStepOptions
): TelematicsVehicleSnapshot {
  const { deltaSeconds } = options;
  const gradePct = options.gradePct ?? 0;

  // Clone snapshot
  const next: TelematicsVehicleSnapshot = JSON.parse(JSON.stringify(vehicle));
  next.timestamp = new Date().toISOString();

  // If vehicle is idle or parked
  if (next.operationalStatus === 'idle') {
    next.engine.roadSpeedMph = 0;
    next.engine.engineRpm = 650 + Math.sin(Date.now() / 1000) * 20;
    next.engine.instantaneousMpg = 0;
    next.safety.excessIdleMinutes += (deltaSeconds / 60);
    // Coolant stabilizes to ~180F
    next.engine.engineCoolantTempF = 180 + Math.sin(Date.now() / 5000) * 3;
    return next;
  }

  // Active in-transit simulation
  const speed = next.engine.roadSpeedMph;
  const distanceMilesTraveled = (speed * (deltaSeconds / 3600));
  next.engine.odometerMiles += distanceMilesTraveled;

  // Grade physics: uphill increases load and RPM, reduces speed slightly
  const baseLoad = 55 + gradePct * 5;
  next.engine.engineLoadPct = Math.min(100, Math.max(20, baseLoad + Math.sin(Date.now() / 2000) * 5));

  // Fuel consumption: ~6.8 MPG average, varying with load and grade
  const instantMpg = Math.max(3.5, 7.5 - (next.engine.engineLoadPct - 50) * 0.08);
  next.engine.instantaneousMpg = Math.round(instantMpg * 10) / 10;

  const fuelGallonsBurned = distanceMilesTraveled / instantMpg;
  // Standard 200-gallon twin tank setup:
  const fuelPctDrop = (fuelGallonsBurned / 200) * 100;
  next.engine.fuelLevelPct = Math.max(0, next.engine.fuelLevelPct - fuelPctDrop);

  // DEF consumption (~2% of diesel burn)
  next.engine.defLevelPct = Math.max(0, next.engine.defLevelPct - fuelPctDrop * 0.4);

  // Coolant temp dynamics (normal 190-205F, rises under high grade/load)
  const targetCoolant = 192 + (next.engine.engineLoadPct > 70 ? (next.engine.engineLoadPct - 70) * 0.4 : 0);
  next.engine.engineCoolantTempF = Math.round(targetCoolant + Math.sin(Date.now() / 3000) * 2);

  // Oil pressure dynamics (40-55 PSI at highway RPM)
  next.engine.engineOilPressurePsi = Math.round(42 + (next.engine.engineRpm / 1500) * 6);

  // Reefer Cold Chain Simulation
  if (next.coldChain.isEquipped) {
    if (next.coldChain.doorOpenState) {
      // Ambient warm air intrusion: temp rises rapidly
      next.coldChain.zone1CurrentTempF += (0.15 * deltaSeconds);
      if (next.coldChain.zone1CurrentTempF > next.coldChain.zone1SetPointF + 6.0) {
        next.coldChain.excursionAlert = 'critical';
      } else if (next.coldChain.zone1CurrentTempF > next.coldChain.zone1SetPointF + 3.0) {
        next.coldChain.excursionAlert = 'caution';
      }
    } else {
      // Closed doors: active cooling drives temperature toward set point
      const diff = next.coldChain.zone1CurrentTempF - next.coldChain.zone1SetPointF;
      if (Math.abs(diff) > 0.2) {
        next.coldChain.zone1CurrentTempF -= Math.sign(diff) * Math.min(Math.abs(diff), 0.04 * deltaSeconds);
      }
      if (next.coldChain.zone1CurrentTempF <= next.coldChain.zone1SetPointF + 2.0) {
        next.coldChain.excursionAlert = 'normal';
      }
    }

    // Reefer fuel consumption (~0.8 gal/hr on continuous)
    const reeferGalBurned = (0.8 / 3600) * deltaSeconds;
    next.coldChain.reeferFuelLevelPct = Math.max(0, next.coldChain.reeferFuelLevelPct - (reeferGalBurned / 50) * 100);
  }

  // GPS Corridor Waypoint Advance
  next.gps.mileMarker += distanceMilesTraveled;
  if (next.gps.mileMarker > CORRIDOR_I80.totalDistanceMiles) {
    next.gps.mileMarker = 0; // Wrap around for continuous loop
  }

  // Find bounding corridor waypoints
  const waypoints = CORRIDOR_I80.waypoints;
  let prevWp = waypoints[0];
  let nextWp = waypoints[waypoints.length - 1];

  for (let i = 0; i < waypoints.length - 1; i++) {
    if (next.gps.mileMarker >= waypoints[i].mile && next.gps.mileMarker <= waypoints[i + 1].mile) {
      prevWp = waypoints[i];
      nextWp = waypoints[i + 1];
      break;
    }
  }

  const segmentLength = nextWp.mile - prevWp.mile;
  const progressRatio = segmentLength > 0 ? (next.gps.mileMarker - prevWp.mile) / segmentLength : 0;

  // Linear interpolation of GPS coordinates
  next.gps.latitude = prevWp.lat + (nextWp.lat - prevWp.lat) * progressRatio;
  next.gps.longitude = prevWp.lng + (nextWp.lng - prevWp.lng) * progressRatio;
  next.gps.nearestCity = progressRatio < 0.5 ? prevWp.city : nextWp.city;
  next.gps.state = progressRatio < 0.5 ? prevWp.state : nextWp.state;

  // Recalculate Composite Health and Driver Safety Scores
  let healthDeduction = 0;
  for (const dtc of next.safety.activeDtcCodes) {
    if (dtc.severity === 'red_stop_engine') healthDeduction += 35;
    else if (dtc.severity === 'amber_warning') healthDeduction += 12;
    else healthDeduction += 4;
  }
  if (next.engine.engineCoolantTempF > 218) healthDeduction += 20;
  if (next.engine.engineOilPressurePsi < 25) healthDeduction += 25;
  if (next.coldChain.excursionAlert === 'critical') healthDeduction += 15;
  next.overallHealthScore = Math.max(0, 100 - healthDeduction);

  let safetyDeduction = next.safety.harshBrakeCount * 4 + next.safety.harshAccelCount * 2 + next.safety.harshCornerCount * 3 + Math.floor(next.safety.overspeedMinutes / 5) * 5;
  next.driverSafetyScore = Math.max(0, 100 - safetyDeduction);

  return next;
}

/**
 * Injects a simulated harsh braking event (> 8.5 mph/s deceleration).
 */
export function injectHarshBrakingEvent(vehicle: TelematicsVehicleSnapshot): TelematicsVehicleSnapshot {
  const next: TelematicsVehicleSnapshot = JSON.parse(JSON.stringify(vehicle));
  next.safety.harshBrakeCount += 1;
  next.engine.roadSpeedMph = Math.max(0, next.engine.roadSpeedMph - 24);
  next.engine.engineRpm = Math.max(700, next.engine.engineRpm - 600);
  next.engine.acceleratorPedalPct = 0;
  next.driverSafetyScore = Math.max(0, next.driverSafetyScore - 4);
  return next;
}

/**
 * Toggles reefer door open state for cold chain excursion testing.
 */
export function toggleReeferDoor(vehicle: TelematicsVehicleSnapshot): TelematicsVehicleSnapshot {
  const next: TelematicsVehicleSnapshot = JSON.parse(JSON.stringify(vehicle));
  if (!next.coldChain.isEquipped) return next;
  next.coldChain.doorOpenState = !next.coldChain.doorOpenState;
  return next;
}

/**
 * Injects an active SAE J1939 Diagnostic Trouble Code (DTC).
 */
export function injectDiagnosticTroubleCode(
  vehicle: TelematicsVehicleSnapshot,
  code: DiagnosticTroubleCode
): TelematicsVehicleSnapshot {
  const next: TelematicsVehicleSnapshot = JSON.parse(JSON.stringify(vehicle));
  const exists = next.safety.activeDtcCodes.some((d) => d.spn === code.spn && d.fmi === code.fmi);
  if (!exists) {
    next.safety.activeDtcCodes.push(code);
  }
  return next;
}

/**
 * Clears all active DTC fault codes.
 */
export function clearDiagnosticTroubleCodes(vehicle: TelematicsVehicleSnapshot): TelematicsVehicleSnapshot {
  const next: TelematicsVehicleSnapshot = JSON.parse(JSON.stringify(vehicle));
  next.safety.activeDtcCodes = [];
  return next;
}
