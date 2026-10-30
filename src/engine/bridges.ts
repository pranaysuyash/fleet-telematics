/**
 * Cross-Project Telematics Bridges.
 * Connects Product 05 real-time telematics streams with the other 4 Trucking platform products.
 */

import { TelematicsVehicleSnapshot } from './types';

function getProductBaseUrl(port: number, cloudUrl: string): string {
  if (typeof window !== 'undefined') {
    const isCloud = window.location.hostname.includes('pages.dev') || window.location.hostname.includes('trucking.io');
    if (isCloud) return cloudUrl;
  }
  return `http://localhost:${port}`;
}

export function buildCargoFitTelematicsBridgeUrl(vehicle: TelematicsVehicleSnapshot): string {
  const base = getProductBaseUrl(5173, 'https://cargofit.pages.dev');
  const params = new URLSearchParams({
    source: 'product-05-telematics',
    unitNumber: vehicle.vehicleUnitNumber,
    speedMph: String(Math.round(vehicle.engine.roadSpeedMph)),
    odometer: String(Math.round(vehicle.engine.odometerMiles)),
    vin: vehicle.vin,
  });
  return `${base}/?${params.toString()}`;
}

export function buildFreightPricingTelematicsBridgeUrl(vehicle: TelematicsVehicleSnapshot): string {
  const base = getProductBaseUrl(5174, 'https://freightpricing.pages.dev');
  const params = new URLSearchParams({
    source: 'product-05-telematics',
    actualMpg: String(vehicle.engine.averageMpg),
    instantMpg: String(vehicle.engine.instantaneousMpg),
    fuelRemainingPct: String(Math.round(vehicle.engine.fuelLevelPct)),
    corridor: vehicle.gps.currentCorridor,
  });
  return `${base}/?${params.toString()}`;
}

export function buildHosPlannerTelematicsBridgeUrl(vehicle: TelematicsVehicleSnapshot): string {
  const base = getProductBaseUrl(5175, 'https://hosdispatch.pages.dev');
  const params = new URLSearchParams({
    source: 'product-05-telematics',
    driverId: vehicle.driverId,
    driverName: vehicle.driverName,
    currentDutyStatus: vehicle.driverHosState,
    speedMph: String(Math.round(vehicle.engine.roadSpeedMph)),
    locationCity: vehicle.gps.nearestCity,
    locationState: vehicle.gps.state,
  });
  return `${base}/?${params.toString()}`;
}

export function buildAssetStudioTelematicsBridgeUrl(vehicle: TelematicsVehicleSnapshot): string {
  const base = getProductBaseUrl(5176, 'https://fleetstudio.pages.dev');
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
  return `${base}/?${params.toString()}`;
}
