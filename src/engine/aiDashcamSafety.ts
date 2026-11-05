/**
 * AI Dashcam Computer Vision Safety Telemetry & Driver Coaching Engine.
 * 
 * Implements fleet video safety intelligence modeled after Samsara, Motive, and Lytx:
 * 1. Driver Monitoring System (DMS): Distraction (cell phone), Drowsiness (PERCLOS), Seatbelt.
 * 2. Forward Road Vision (ADAS): Forward Collision Warning (TTC), Tailgating, Rolling Stops.
 * 3. Harsh G-Force Dynamics: Harsh braking, cornering, acceleration.
 * 4. Composite Safety Coaching Score (0-100) & Video Evidence Queue.
 */

export type VisionEventSeverity = 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'INFO';

export type VisionEventCategory =
  | 'CELL_PHONE_DISTRACTION'
  | 'DROWSINESS_FATIGUE'
  | 'SEATBELT_UNFASTENED'
  | 'FORWARD_COLLISION_WARNING'
  | 'TAILGATING_CLOSE_FOLLOW'
  | 'ROLLING_STOP_SIGN'
  | 'HARSH_BRAKING_EVENT';

export interface VisionSafetyEvent {
  id: string;
  timestamp: string;
  category: VisionEventCategory;
  severity: VisionEventSeverity;
  title: string;
  description: string;
  vehicleSpeedMph: number;
  cameraLens: 'IN_CAB_DMS' | 'ROAD_FACING_ADAS';
  aiConfidencePct: number;
  metricValue: string; // e.g., "TTC 0.8s", "PERCLOS 88%", "0.48g Decel"
  driverCoachingRecommended: boolean;
  videoClipDurationSec: number;
}

export interface DriverSafetyProfile {
  driverId: string;
  driverName: string;
  totalMilesAudited: number;
  compositeSafetyScore: number; // 0 to 100
  scoreTier: 'EXEMPLARY' | 'SATISFACTORY' | 'NEEDS_COACHING' | 'HIGH_RISK';
  eventsCount: Record<VisionEventCategory, number>;
  activeCoachingQueue: VisionSafetyEvent[];
}

export const SAMPLE_SAFETY_EVENTS: VisionSafetyEvent[] = [
  {
    id: 'EVT-901',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    category: 'CELL_PHONE_DISTRACTION',
    severity: 'MAJOR',
    title: 'Mobile Phone Distraction Detected',
    description: 'In-cab camera identified driver holding smartphone to ear while operating at 62 mph.',
    vehicleSpeedMph: 62,
    cameraLens: 'IN_CAB_DMS',
    aiConfidencePct: 96.4,
    metricValue: 'Duration 4.2s',
    driverCoachingRecommended: true,
    videoClipDurationSec: 15,
  },
  {
    id: 'EVT-902',
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    category: 'FORWARD_COLLISION_WARNING',
    severity: 'CRITICAL',
    title: 'Imminent Forward Collision Alert',
    description: 'Rapidly decelerating passenger vehicle ahead; time-to-collision dropped below safe threshold.',
    vehicleSpeedMph: 58,
    cameraLens: 'ROAD_FACING_ADAS',
    aiConfidencePct: 98.8,
    metricValue: 'TTC 0.9s',
    driverCoachingRecommended: true,
    videoClipDurationSec: 20,
  },
  {
    id: 'EVT-903',
    timestamp: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    category: 'HARSH_BRAKING_EVENT',
    severity: 'MODERATE',
    title: 'Harsh Longitudinal Deceleration',
    description: 'Braking G-force exceeded standard comfort envelope.',
    vehicleSpeedMph: 45,
    cameraLens: 'ROAD_FACING_ADAS',
    aiConfidencePct: 100,
    metricValue: '-0.46g',
    driverCoachingRecommended: false,
    videoClipDurationSec: 10,
  },
];

/**
 * Calculates a composite safety score (0-100) based on severity-weighted infraction deductions.
 */
export function calculateDriverSafetyScore(
  events: VisionSafetyEvent[],
  totalMiles: number = 850
): DriverSafetyProfile {
  let score = 100;
  const counts: Record<VisionEventCategory, number> = {
    CELL_PHONE_DISTRACTION: 0,
    DROWSINESS_FATIGUE: 0,
    SEATBELT_UNFASTENED: 0,
    FORWARD_COLLISION_WARNING: 0,
    TAILGATING_CLOSE_FOLLOW: 0,
    ROLLING_STOP_SIGN: 0,
    HARSH_BRAKING_EVENT: 0,
  };

  for (const evt of events) {
    counts[evt.category] = (counts[evt.category] || 0) + 1;

    switch (evt.severity) {
      case 'CRITICAL':
        score -= 15;
        break;
      case 'MAJOR':
        score -= 8;
        break;
      case 'MODERATE':
        score -= 3;
        break;
      case 'INFO':
        score -= 1;
        break;
    }
  }

  score = Math.max(0, Math.min(100, score));

  let tier: DriverSafetyProfile['scoreTier'] = 'EXEMPLARY';
  if (score < 70) {
    tier = 'HIGH_RISK';
  } else if (score < 85) {
    tier = 'NEEDS_COACHING';
  } else if (score < 95) {
    tier = 'SATISFACTORY';
  }

  const coachingQueue = events.filter((e) => e.driverCoachingRecommended);

  return {
    driverId: 'DRV-4402',
    driverName: 'Robert Vance',
    totalMilesAudited: totalMiles,
    compositeSafetyScore: score,
    scoreTier: tier,
    eventsCount: counts,
    activeCoachingQueue: coachingQueue,
  };
}
