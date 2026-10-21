/**
 * Domain types for Product 05: Fleet Telematics & Real-Time Tracking HUD.
 * Covers SAE J1939 CAN Bus OBD-II telemetry parameters, cold-chain temperature sensors,
 * GPS corridor waypoint tracking, Diagnostic Trouble Codes (DTC), and safety events.
 */

export type VehicleOperationalStatus =
  | 'in_transit'
  | 'idle'
  | 'loading_unloading'
  | 'detained'
  | 'breakdown'
  | 'out_of_service';

export type DriverHosDutyState =
  | 'driving'
  | 'on_duty_not_driving'
  | 'sleeper_berth'
  | 'off_duty';

export type DiagnosticSeverity = 'info' | 'amber_warning' | 'red_stop_engine';

export interface DiagnosticTroubleCode {
  spn: number; // Suspect Parameter Number (e.g. 110 = Coolant Temp, 100 = Oil Pressure)
  fmi: number; // Failure Mode Identifier (e.g. 0 = Data Above Normal, 1 = Data Below Normal)
  description: string;
  sourceAddress: string;
  severity: DiagnosticSeverity;
  timestamp: string;
}

export interface ColdChainTelemetry {
  isEquipped: boolean;
  zone1SetPointF: number;
  zone1CurrentTempF: number;
  zone1ReturnAirF: number;
  zone2SetPointF?: number;
  zone2CurrentTempF?: number;
  compressorMode: 'continuous' | 'start_stop' | 'defrost' | 'off';
  reeferEngineHours: number;
  reeferFuelLevelPct: number;
  reeferBatteryVoltage: number;
  doorOpenState: boolean;
  excursionAlert: 'normal' | 'caution' | 'critical';
}

export interface J1939EngineTelemetry {
  engineRpm: number;
  roadSpeedMph: number;
  odometerMiles: number;
  engineCoolantTempF: number;
  engineOilPressurePsi: number;
  engineOilTempF: number;
  fuelLevelPct: number;
  defLevelPct: number; // Diesel Exhaust Fluid
  instantaneousMpg: number;
  averageMpg: number;
  batteryVoltageV: number;
  acceleratorPedalPct: number;
  engineLoadPct: number;
  transmissionGear: number;
  cruiseControlActive: boolean;
  totalEngineHours: number;
  totalIdleHours: number;
}

export interface GpsLocationTelemetry {
  latitude: number;
  longitude: number;
  headingDegrees: number;
  elevationFeet: number;
  currentCorridor: string; // e.g. "I-80 Westbound"
  mileMarker: number;
  nearestCity: string;
  state: string;
  geofenceStatus: 'en_route' | 'at_origin' | 'at_destination' | 'weigh_station' | 'rest_stop';
}

export interface SafetyTelematicsEvents {
  harshBrakeCount: number;
  harshAccelCount: number;
  harshCornerCount: number;
  excessIdleMinutes: number;
  overspeedMinutes: number;
  activeDtcCodes: DiagnosticTroubleCode[];
}

export interface TelematicsVehicleSnapshot {
  vehicleId: string;
  vehicleUnitNumber: string;
  vin: string;
  makeModel: string;
  driverName: string;
  driverId: string;
  driverHosState: DriverHosDutyState;
  operationalStatus: VehicleOperationalStatus;
  timestamp: string;
  engine: J1939EngineTelemetry;
  coldChain: ColdChainTelemetry;
  gps: GpsLocationTelemetry;
  safety: SafetyTelematicsEvents;
  overallHealthScore: number; // 0 - 100
  driverSafetyScore: number; // 0 - 100
}
