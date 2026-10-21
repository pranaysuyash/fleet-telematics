/**
 * Pre-defined Interstate Freight Corridors, Geofences, and Active Fleet Roster
 * for real-time telematics tracking and GPS simulation.
 */

import { TelematicsVehicleSnapshot } from './types';

export interface Waypoint {
  name: string;
  mile: number;
  lat: number;
  lng: number;
  city: string;
  state: string;
  type: 'terminal' | 'weigh_station' | 'rest_stop' | 'junction';
}

export interface CorridorRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  totalDistanceMiles: number;
  speedLimitMph: number;
  waypoints: Waypoint[];
}

export const CORRIDOR_I80: CorridorRoute = {
  id: 'i80_midwest_intermountain',
  name: 'I-80 Midwest to Intermountain Corridor',
  origin: 'Joliet, IL Logistics Hub',
  destination: 'Salt Lake City, UT Freight Terminal',
  totalDistanceMiles: 1390,
  speedLimitMph: 70,
  waypoints: [
    { name: 'Joliet Terminal (Origin)', mile: 0, lat: 41.525, lng: -88.081, city: 'Joliet', state: 'IL', type: 'terminal' },
    { name: 'Moline Mississippi River Crossing', mile: 155, lat: 41.506, lng: -90.515, city: 'Moline', state: 'IL', type: 'junction' },
    { name: 'Des Moines Weigh Station', mile: 330, lat: 41.600, lng: -93.609, city: 'Des Moines', state: 'IA', type: 'weigh_station' },
    { name: 'Omaha Platte River Oasis', mile: 468, lat: 41.256, lng: -95.934, city: 'Omaha', state: 'NE', type: 'rest_stop' },
    { name: 'North Platte Flying J', mile: 742, lat: 41.123, lng: -100.765, city: 'North Platte', state: 'NE', type: 'rest_stop' },
    { name: 'Cheyenne High Plains Scale', mile: 965, lat: 41.139, lng: -104.820, city: 'Cheyenne', state: 'WY', type: 'weigh_station' },
    { name: 'Sherman Summit (8,640 ft Pass)', mile: 1002, lat: 41.238, lng: -105.438, city: 'Buford', state: 'WY', type: 'junction' },
    { name: 'Rock Springs TA Travel Center', mile: 1215, lat: 41.587, lng: -109.222, city: 'Rock Springs', state: 'WY', type: 'rest_stop' },
    { name: 'Salt Lake City Terminal (Destination)', mile: 1390, lat: 40.760, lng: -111.891, city: 'Salt Lake City', state: 'UT', type: 'terminal' },
  ],
};

export const INITIAL_FLEET_VEHICLES: TelematicsVehicleSnapshot[] = [
  {
    vehicleId: 'unit_104_reefer',
    vehicleUnitNumber: 'TRK-104',
    vin: '1FUJGLDR5NLBH9821',
    makeModel: '2024 Freightliner Cascadia 126 Sleeper',
    driverName: 'Marcus Vance',
    driverId: 'DRV-8492',
    driverHosState: 'driving',
    operationalStatus: 'in_transit',
    timestamp: new Date().toISOString(),
    engine: {
      engineRpm: 1240,
      roadSpeedMph: 66.8,
      odometerMiles: 142850,
      engineCoolantTempF: 194,
      engineOilPressurePsi: 44,
      engineOilTempF: 212,
      fuelLevelPct: 76,
      defLevelPct: 82,
      instantaneousMpg: 7.2,
      averageMpg: 6.9,
      batteryVoltageV: 13.9,
      acceleratorPedalPct: 48,
      engineLoadPct: 62,
      transmissionGear: 12,
      cruiseControlActive: true,
      totalEngineHours: 3210,
      totalIdleHours: 412,
    },
    coldChain: {
      isEquipped: true,
      zone1SetPointF: 34.0, // Fresh produce / dairy
      zone1CurrentTempF: 34.4,
      zone1ReturnAirF: 35.1,
      compressorMode: 'continuous',
      reeferEngineHours: 1840,
      reeferFuelLevelPct: 88,
      reeferBatteryVoltage: 13.6,
      doorOpenState: false,
      excursionAlert: 'normal',
    },
    gps: {
      latitude: 41.139,
      longitude: -104.82,
      headingDegrees: 268,
      elevationFeet: 6062,
      currentCorridor: 'I-80 Westbound',
      mileMarker: 965,
      nearestCity: 'Cheyenne',
      state: 'WY',
      geofenceStatus: 'en_route',
    },
    safety: {
      harshBrakeCount: 0,
      harshAccelCount: 1,
      harshCornerCount: 0,
      excessIdleMinutes: 8,
      overspeedMinutes: 2,
      activeDtcCodes: [],
    },
    overallHealthScore: 98,
    driverSafetyScore: 95,
  },
  {
    vehicleId: 'unit_208_flatbed',
    vehicleUnitNumber: 'TRK-208',
    vin: '3AKJHHDR2PLCK1124',
    makeModel: '2023 Kenworth W990 Studio Sleeper',
    driverName: 'Elena Rostova',
    driverId: 'DRV-7331',
    driverHosState: 'driving',
    operationalStatus: 'in_transit',
    timestamp: new Date().toISOString(),
    engine: {
      engineRpm: 1410,
      roadSpeedMph: 64.2,
      odometerMiles: 218400,
      engineCoolantTempF: 201,
      engineOilPressurePsi: 41,
      engineOilTempF: 220,
      fuelLevelPct: 48,
      defLevelPct: 61,
      instantaneousMpg: 5.8,
      averageMpg: 6.1,
      batteryVoltageV: 13.8,
      acceleratorPedalPct: 68,
      engineLoadPct: 78,
      transmissionGear: 11,
      cruiseControlActive: false,
      totalEngineHours: 4820,
      totalIdleHours: 620,
    },
    coldChain: {
      isEquipped: false,
      zone1SetPointF: 0,
      zone1CurrentTempF: 0,
      zone1ReturnAirF: 0,
      compressorMode: 'off',
      reeferEngineHours: 0,
      reeferFuelLevelPct: 0,
      reeferBatteryVoltage: 0,
      doorOpenState: false,
      excursionAlert: 'normal',
    },
    gps: {
      latitude: 41.238,
      longitude: -105.438,
      headingDegrees: 275,
      elevationFeet: 8640,
      currentCorridor: 'I-80 Westbound (Sherman Pass)',
      mileMarker: 1002,
      nearestCity: 'Buford',
      state: 'WY',
      geofenceStatus: 'en_route',
    },
    safety: {
      harshBrakeCount: 1,
      harshAccelCount: 0,
      harshCornerCount: 1,
      excessIdleMinutes: 14,
      overspeedMinutes: 0,
      activeDtcCodes: [],
    },
    overallHealthScore: 94,
    driverSafetyScore: 90,
  },
  {
    vehicleId: 'unit_312_dryvan',
    vehicleUnitNumber: 'TRK-312',
    vin: '1XKWD49X0MR109284',
    makeModel: '2022 Peterbilt 579 UltraLoft',
    driverName: 'Devon Carter',
    driverId: 'DRV-9014',
    driverHosState: 'sleeper_berth',
    operationalStatus: 'idle',
    timestamp: new Date().toISOString(),
    engine: {
      engineRpm: 650, // Idle
      roadSpeedMph: 0.0,
      odometerMiles: 340120,
      engineCoolantTempF: 182,
      engineOilPressurePsi: 28,
      engineOilTempF: 190,
      fuelLevelPct: 32,
      defLevelPct: 45,
      instantaneousMpg: 0.0,
      averageMpg: 6.8,
      batteryVoltageV: 13.2,
      acceleratorPedalPct: 0,
      engineLoadPct: 15,
      transmissionGear: 0, // Neutral
      cruiseControlActive: false,
      totalEngineHours: 7120,
      totalIdleHours: 1420,
    },
    coldChain: {
      isEquipped: false,
      zone1SetPointF: 0,
      zone1CurrentTempF: 0,
      zone1ReturnAirF: 0,
      compressorMode: 'off',
      reeferEngineHours: 0,
      reeferFuelLevelPct: 0,
      reeferBatteryVoltage: 0,
      doorOpenState: false,
      excursionAlert: 'normal',
    },
    gps: {
      latitude: 41.587,
      longitude: -109.222,
      headingDegrees: 0,
      elevationFeet: 6271,
      currentCorridor: 'I-80 Exit 104 Truck Stop',
      mileMarker: 1215,
      nearestCity: 'Rock Springs',
      state: 'WY',
      geofenceStatus: 'rest_stop',
    },
    safety: {
      harshBrakeCount: 0,
      harshAccelCount: 0,
      harshCornerCount: 0,
      excessIdleMinutes: 28,
      overspeedMinutes: 0,
      activeDtcCodes: [
        {
          spn: 111,
          fmi: 1,
          description: 'Engine Coolant Level Low',
          sourceAddress: 'Engine #1 (00)',
          severity: 'amber_warning',
          timestamp: new Date().toISOString(),
        },
      ],
    },
    overallHealthScore: 86,
    driverSafetyScore: 92,
  },
];
