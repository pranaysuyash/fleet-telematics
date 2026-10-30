import React from 'react';
import { IconMapPin, IconTruck } from './icons';
import { GpsLocationTelemetry } from '../engine/types';
import { CORRIDOR_I80 } from '../engine/corridors';

interface CorridorMapCanvasProps {
  gps: GpsLocationTelemetry;
}

export const CorridorMapCanvas: React.FC<CorridorMapCanvasProps> = ({ gps }) => {
  const waypoints = CORRIDOR_I80.waypoints;
  const currentMile = gps.mileMarker;
  const totalMiles = CORRIDOR_I80.totalDistanceMiles;
  const progressPct = Math.min(100, (currentMile / totalMiles) * 100);

  return (
    <div className="telematics-card map-card">
      <div className="card-header">
        <div className="header-with-icon">
          <h3><span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconMapPin size={16} /> GPS Corridor & Waypoint Geofencing Engine</span></h3>
          <span className="corridor-title">{CORRIDOR_I80.name}</span>
        </div>
        <div className="location-pill">
          {gps.nearestCity}, {gps.state} · Mile {Math.round(currentMile)} / {totalMiles}
        </div>
      </div>

      {/* Corridor Linear Schematic Canvas */}
      <div className="corridor-schematic-box">
        <div className="route-header-labels">
          <span>{CORRIDOR_I80.origin}</span>
          <span className="current-gps-coords">
            Lat {gps.latitude.toFixed(4)}°, Lng {gps.longitude.toFixed(4)}° · Elev {Math.round(gps.elevationFeet)} ft
          </span>
          <span>{CORRIDOR_I80.destination}</span>
        </div>

        {/* Progress Track */}
        <div className="corridor-progress-track">
          <div
            className="corridor-progress-fill"
            style={{ width: `${progressPct}%` }}
          />

          {/* Waypoint pins */}
          {waypoints.map((wp, idx) => {
            const wpPct = (wp.mile / totalMiles) * 100;
            const isPassed = currentMile >= wp.mile;
            return (
              <div
                key={idx}
                className={`waypoint-node ${isPassed ? 'passed' : ''}`}
                style={{ left: `${wpPct}%` }}
                title={`${wp.name} (Mile ${wp.mile})`}
              >
                <div className={`wp-pin ${wp.type}`} />
                <span className="wp-label">{wp.city}</span>
              </div>
            );
          })}

          {/* Current Truck Pulse Marker */}
          <div
            className="truck-pulse-marker"
            style={{ left: `${progressPct}%` }}
            title={`Current Position: Mile ${Math.round(currentMile)}`}
          >
            <div className="truck-pulse-core"><IconTruck size={14} /></div>
          </div>
        </div>
      </div>

      <div className="geofence-status-bar">
        <div className="geofence-item">
          <span className="geo-lbl">CURRENT HIGHWAY:</span>
          <strong className="geo-val">{gps.currentCorridor}</strong>
        </div>
        <div className="geofence-item">
          <span className="geo-lbl">HEADING:</span>
          <strong className="geo-val">{Math.round(gps.headingDegrees)}° West</strong>
        </div>
        <div className="geofence-item">
          <span className="geo-lbl">GEOFENCE STATUS:</span>
          <strong className="geo-val geo-status-highlight">
            {gps.geofenceStatus.replace('_', ' ').toUpperCase()}
          </strong>
        </div>
      </div>
    </div>
  );
};
