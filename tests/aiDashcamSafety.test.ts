import { describe, it, expect } from 'vitest';
import {
  calculateDriverSafetyScore,
  SAMPLE_SAFETY_EVENTS,
  VisionSafetyEvent,
} from '../src/engine/aiDashcamSafety';

describe('AI Dashcam Computer Vision Safety Telemetry (T-035)', () => {
  it('awards exemplary score (100) when zero safety infractions occur', () => {
    const profile = calculateDriverSafetyScore([], 1200);

    expect(profile.compositeSafetyScore).toBe(100);
    expect(profile.scoreTier).toBe('EXEMPLARY');
    expect(profile.activeCoachingQueue.length).toBe(0);
  });

  it('deducts appropriate points for critical and major safety events', () => {
    // 1 CRITICAL (-15) + 1 MAJOR (-8) + 1 MODERATE (-3) = 100 - 26 = 74
    const profile = calculateDriverSafetyScore(SAMPLE_SAFETY_EVENTS, 850);

    expect(profile.compositeSafetyScore).toBe(74);
    expect(profile.scoreTier).toBe('NEEDS_COACHING');
    expect(profile.activeCoachingQueue.length).toBe(2);
    expect(profile.eventsCount.CELL_PHONE_DISTRACTION).toBe(1);
    expect(profile.eventsCount.FORWARD_COLLISION_WARNING).toBe(1);
  });

  it('classifies HIGH_RISK tier when multiple severe infractions accumulate', () => {
    const severeEvents: VisionSafetyEvent[] = [
      ...SAMPLE_SAFETY_EVENTS,
      {
        id: 'EVT-904',
        timestamp: new Date().toISOString(),
        category: 'DROWSINESS_FATIGUE',
        severity: 'CRITICAL',
        title: 'Microsleep Eye Closure > 80%',
        description: 'PERCLOS sensor detected prolonged eye closure.',
        vehicleSpeedMph: 60,
        cameraLens: 'IN_CAB_DMS',
        aiConfidencePct: 99.1,
        metricValue: 'PERCLOS 92%',
        driverCoachingRecommended: true,
        videoClipDurationSec: 20,
      },
    ];

    const profile = calculateDriverSafetyScore(severeEvents, 850);
    expect(profile.compositeSafetyScore).toBeLessThan(70);
    expect(profile.scoreTier).toBe('HIGH_RISK');
  });
});
