/**
 * Cross-Project Telematics Bridges.
 * Connects Product 05 real-time telematics streams with the other 4 Trucking platform products.
 */

import { TelematicsVehicleSnapshot } from './types';

export function buildCargoFitTelematicsBridgeUrl(vehicle: TelematicsVehicleSnapshot): string {
  const params = new URLSearchParams({
    source: 'product-05-telematics',
    unitNumber: vehicle.vehicleUnitNumber,
    speedMph: String(Math.round(vehicle.engine.roadSpeedMph)),
    odometer: String(Math.round(vehicle.engine.odometerMiles)),
    vin: vehicle.vin,
  });
  return `http://localhost:5173/?${params.toString()}`;
}

export function buildFreightPricingTelematicsBridgeUrl(vehicle: TelematicsVehicleSnapshot): string {
  const params = new URLSearchParams({
    source: 'product-05-telematics',
    actualMpg: String(vehicle.engine.averageMpg),
    instantMpg: String(vehicle.engine.instantaneousMpg),
    fuelRemainingPct: String(Math.round(vehicle.engine.fuelLevelPct)),
    corridor: vehicle.gps.currentCorridor,
  });
  return `http://localhost:5174/?${params.toString()}`;
}

export function buildHosPlannerTelematicsBridgeUrl(vehicle: TelematicsVehicleSnapshot): string {
  const params = new URLSearchParams({
    source: 'product-05-telematics',
    driverId: vehicle.driverId,
    driverName: vehicle.driverName,
    currentDutyStatus: vehicle.driverHosState,
    speedMph: String(Math.round(vehicle.engine.roadSpeedMph)),
    locationCity: vehicle.gps.nearestCity,
    locationState: vehicle.gps.state,
  });
  return `http://localhost:5175/?${params.toString()}`;
}

export function buildAssetStudioTelematicsBridgeUrl(vehicle: TelematicsVehicleSnapshot): string {
  // Map vehicle ID to Asset Studio catalog vehicle
  let assetId = 'dry-van-53';
  if (vehicle.coldChain.isEquipped) {
    assetId = 'reefer-53';
  } else if (vehicle.vehicleId.includes('flatbed')) {
    assetId = 'flatbed-48';
  }

  const params = new URLSearchParams({
    source: 'product-05-telematics',
    vehicle: assetId,
    telematicsUnit: vehicle.vehicleUnitNumber,
    healthScore: String(vehicle.overallHealthScore),
  });
  return `http://localhost:5176/?${params.toString()}`;
}
