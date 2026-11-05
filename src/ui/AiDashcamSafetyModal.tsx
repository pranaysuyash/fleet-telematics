import React, { useState } from 'react';
import {
  SAMPLE_SAFETY_EVENTS,
  calculateDriverSafetyScore,
  VisionSafetyEvent,
} from '../engine/aiDashcamSafety';

export interface AiDashcamSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverName?: string;
}

export const AiDashcamSafetyModal: React.FC<AiDashcamSafetyModalProps> = ({
  isOpen,
  onClose,
  driverName = 'Robert Vance',
}) => {
  const [events, setEvents] = useState<VisionSafetyEvent[]>(SAMPLE_SAFETY_EVENTS);
  const [activeTab, setActiveTab] = useState<'EVENTS_FEED' | 'COACHING_QUEUE'>('EVENTS_FEED');

  if (!isOpen) return null;

  const profile = calculateDriverSafetyScore(events);

  const handleDismissCoaching = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, driverCoachingRecommended: false } : e))
    );
  };

  const handleSimulateEvent = () => {
    const newEvt: VisionSafetyEvent = {
      id: `EVT-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      category: 'CELL_PHONE_DISTRACTION',
      severity: 'MAJOR',
      title: 'Mobile Phone Distraction (Live)',
      description: 'In-cab AI camera detected hand-held mobile device usage while in motion.',
      vehicleSpeedMph: 64,
      cameraLens: 'IN_CAB_DMS',
      aiConfidencePct: 97.2,
      metricValue: 'Duration 5.1s',
      driverCoachingRecommended: true,
      videoClipDurationSec: 15,
    };
    setEvents([newEvt, ...events]);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-dashcam-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(2, 6, 23, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '740px',
          backgroundColor: '#0b1329',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#f8fafc',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, #0b1329 0%, #111e38 100%)',
          }}
        >
          <div>
            <h3
              id="ai-dashcam-title"
              style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#38bdf8' }}
            >
              📹 AI Dashcam Computer Vision Safety Telemetry
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>
              Driver: {driverName} · In-Cab DMS &amp; Road-Facing ADAS Vision Stream
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Row: Safety Score HUD & Simulation Trigger */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#0f172a',
              padding: '14px 18px',
              borderRadius: '8px',
              border: '1px solid #1e293b',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>SAFETY SCORE:</span>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    color:
                      profile.compositeSafetyScore >= 85
                        ? '#10b981'
                        : profile.compositeSafetyScore >= 70
                        ? '#f59e0b'
                        : '#ef4444',
                  }}
                >
                  {profile.compositeSafetyScore} / 100
                </div>
              </div>

              <div>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>RISK TIER:</span>
                <div>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      backgroundColor:
                        profile.scoreTier === 'EXEMPLARY'
                          ? 'rgba(16, 185, 129, 0.2)'
                          : profile.scoreTier === 'NEEDS_COACHING'
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(239, 68, 68, 0.2)',
                      color:
                        profile.scoreTier === 'EXEMPLARY'
                          ? '#10b981'
                          : profile.scoreTier === 'NEEDS_COACHING'
                          ? '#f59e0b'
                          : '#ef4444',
                    }}
                  >
                    {profile.scoreTier.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSimulateEvent}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Simulate In-Cab Distraction Event
            </button>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('EVENTS_FEED')}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                background: activeTab === 'EVENTS_FEED' ? '#1e293b' : 'transparent',
                color: activeTab === 'EVENTS_FEED' ? '#38bdf8' : '#94a3b8',
                fontSize: '12px',
                fontWeight: activeTab === 'EVENTS_FEED' ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              Telemetry Events Feed ({events.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('COACHING_QUEUE')}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                background: activeTab === 'COACHING_QUEUE' ? '#1e293b' : 'transparent',
                color: activeTab === 'COACHING_QUEUE' ? '#f59e0b' : '#94a3b8',
                fontSize: '12px',
                fontWeight: activeTab === 'COACHING_QUEUE' ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              Driver Coaching Queue ({profile.activeCoachingQueue.length})
            </button>
          </div>

          {/* List of Events / Coaching Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(activeTab === 'EVENTS_FEED' ? events : profile.activeCoachingQueue).map((evt) => (
              <div
                key={evt.id}
                style={{
                  background: '#090d1c',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: 800,
                        backgroundColor:
                          evt.severity === 'CRITICAL'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : evt.severity === 'MAJOR'
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(56, 189, 248, 0.2)',
                        color:
                          evt.severity === 'CRITICAL'
                            ? '#ef4444'
                            : evt.severity === 'MAJOR'
                            ? '#f59e0b'
                            : '#38bdf8',
                      }}
                    >
                      {evt.severity}
                    </span>
                    <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{evt.title}</strong>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      ({evt.cameraLens.replace('_', ' ')})
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#cbd5e1' }}>{evt.description}</p>
                  <div style={{ marginTop: '4px', fontSize: '10px', color: '#94a3b8', display: 'flex', gap: '12px' }}>
                    <span>Speed: <strong>{evt.vehicleSpeedMph} mph</strong></span>
                    <span>AI Confidence: <strong>{evt.aiConfidencePct}%</strong></span>
                    <span>Telemetry: <strong>{evt.metricValue}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>{evt.videoClipDurationSec}s MP4</span>
                  {evt.driverCoachingRecommended && (
                    <button
                      type="button"
                      onClick={() => handleDismissCoaching(evt.id)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        color: '#34d399',
                        fontSize: '10px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Sign Off Coaching ✓
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'flex-end',
            background: '#090d1c',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '6px',
              color: '#94a3b8',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Close Safety Console
          </button>
        </div>
      </div>
    </div>
  );
};
