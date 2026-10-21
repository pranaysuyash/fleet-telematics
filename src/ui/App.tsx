import { useState, useEffect } from 'react';
import { TelematicsVehicleSnapshot, DiagnosticTroubleCode } from '../engine/types';
import {
  INITIAL_FLEET_VEHICLES,
} from '../engine/corridors';
import {
  stepTelematicsSimulation,
  injectHarshBrakingEvent,
  toggleReeferDoor,
  injectDiagnosticTroubleCode,
  clearDiagnosticTroubleCodes,
} from '../engine/telematics';
import {
  buildCargoFitTelematicsBridgeUrl,
  buildFreightPricingTelematicsBridgeUrl,
  buildHosPlannerTelematicsBridgeUrl,
  buildAssetStudioTelematicsBridgeUrl,
} from '../engine/bridges';
import { CrossProjectNav } from './CrossProjectNav';
import { LiveGauges } from './LiveGauges';
import { ColdChainLogger } from './ColdChainLogger';
import { CorridorMapCanvas } from './CorridorMapCanvas';
import { DtcAlertPanel } from './DtcAlertPanel';
import { SuiteDock } from './SuiteDock';

export function App() {
  const [fleet, setFleet] = useState<TelematicsVehicleSnapshot[]>(INITIAL_FLEET_VEHICLES);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(INITIAL_FLEET_VEHICLES[0].vehicleId);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x, 5x, 10x

  const activeVehicle = fleet.find((v) => v.vehicleId === selectedVehicleId) || fleet[0];

  // Simulation step timer
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setFleet((prevFleet) => {
        return prevFleet.map((veh) => {
          return stepTelematicsSimulation(veh, {
            deltaSeconds: 1 * simSpeed,
            gradePct: veh.gps.elevationFeet > 7000 ? 3.5 : 0, // High pass climb
          });
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, simSpeed]);

  const updateActiveVehicle = (updater: (v: TelematicsVehicleSnapshot) => TelematicsVehicleSnapshot) => {
    setFleet((prev) =>
      prev.map((v) => (v.vehicleId === activeVehicle.vehicleId ? updater(v) : v))
    );
  };

  const handleToggleDoor = () => {
    updateActiveVehicle((v) => toggleReeferDoor(v));
  };

  const handleInjectHarshBrake = () => {
    updateActiveVehicle((v) => injectHarshBrakingEvent(v));
  };

  const handleInjectCode = (code: DiagnosticTroubleCode) => {
    updateActiveVehicle((v) => injectDiagnosticTroubleCode(v, code));
  };

  const handleClearCodes = () => {
    updateActiveVehicle((v) => clearDiagnosticTroubleCodes(v));
  };

  // Cross-project URLs
  const p01Url = buildCargoFitTelematicsBridgeUrl(activeVehicle);
  const p02Url = buildFreightPricingTelematicsBridgeUrl(activeVehicle);
  const p03Url = buildHosPlannerTelematicsBridgeUrl(activeVehicle);
  const p04Url = buildAssetStudioTelematicsBridgeUrl(activeVehicle);

  return (
    <div className="telematics-app-root">
      <SuiteDock currentProductId="product-05-fleet-telematics" />
      {/* Platform Cross-Project Navigation Header */}
      <CrossProjectNav />

      {/* Main Container */}
      <div className="telematics-content-wrap">
        {/* Top Control Bar: Fleet Selector & Simulation Controls */}
        <div className="fleet-top-bar">
          <div className="fleet-selector-group">
            <span className="bar-label">MONITORED UNIT:</span>
            {fleet.map((v) => (
              <button
                key={v.vehicleId}
                className={`btn-unit-select ${v.vehicleId === activeVehicle.vehicleId ? 'active' : ''}`}
                onClick={() => setSelectedVehicleId(v.vehicleId)}
              >
                <span className="unit-name">{v.vehicleUnitNumber}</span>
                <span className="unit-driver">{v.driverName}</span>
                <span className={`unit-dot ${v.operationalStatus}`} />
              </button>
            ))}
          </div>

          <div className="simulation-controls-group">
            <span className="bar-label">SIM ENGINE:</span>
            <button
              className={`btn-sim-play ${isPlaying ? 'playing' : 'paused'}`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? '⏸ PAUSE' : '▶ RESUME LIVE'}
            </button>

            <div className="speed-pills">
              {[1, 5, 10].map((s) => (
                <button
                  key={s}
                  className={`btn-speed ${simSpeed === s ? 'active' : ''}`}
                  onClick={() => setSimSpeed(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vehicle Identity & Hardware Banner */}
        <div className="unit-profile-banner">
          <div className="profile-col">
            <span className="prof-label">VEHICLE UNIT & MODEL</span>
            <h2 className="prof-val">{activeVehicle.vehicleUnitNumber} · {activeVehicle.makeModel}</h2>
            <span className="prof-sub">VIN: {activeVehicle.vin}</span>
          </div>

          <div className="profile-col">
            <span className="prof-label">ASSIGNED DRIVER & DUTY STATUS</span>
            <h3 className="prof-val">
              {activeVehicle.driverName} ({activeVehicle.driverId})
            </h3>
            <span className="prof-sub badge-hos">
              ELD STATUS: {activeVehicle.driverHosState.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="profile-col">
            <span className="prof-label">ODOMETER & ENGINE HOURS</span>
            <h3 className="prof-val">{Math.round(activeVehicle.engine.odometerMiles).toLocaleString()} Miles</h3>
            <span className="prof-sub">{activeVehicle.engine.totalEngineHours.toLocaleString()} Engine Hours</span>
          </div>

          <div className="profile-col cross-links-col">
            <span className="prof-label">CROSS-PROJECT BRIDGES</span>
            <div className="bridge-button-row">
              <a href={p01Url} target="_blank" rel="noopener noreferrer" className="btn-cross-bridge p01" title="Compare payload weight vs axle distribution">
                P01 Cargo Fit ↗
              </a>
              <a href={p02Url} target="_blank" rel="noopener noreferrer" className="btn-cross-bridge p02" title="Feed actual fuel burn rate into freight pricing HUD">
                P02 Pricing ↗
              </a>
              <a href={p03Url} target="_blank" rel="noopener noreferrer" className="btn-cross-bridge p03" title="Inspect driver FMCSA 24-hr ELD compliance log">
                P03 HOS ↗
              </a>
              <a href={p04Url} target="_blank" rel="noopener noreferrer" className="btn-cross-bridge p04" title="Inspect 3D digital twin of this vehicle asset">
                P04 Asset 3D ↗
              </a>
            </div>
          </div>
        </div>

        {/* PRIMARY TELEMATICS GRID */}
        <div className="telematics-main-grid">
          {/* Gauges & J1939 Engine Diagnostics */}
          <LiveGauges engine={activeVehicle.engine} operationalStatus={activeVehicle.operationalStatus} />

          {/* Cold Chain Data Logger (if equipped) */}
          <ColdChainLogger coldChain={activeVehicle.coldChain} onToggleDoor={handleToggleDoor} />

          {/* GPS Corridor Progression & Geofences */}
          <CorridorMapCanvas gps={activeVehicle.gps} />

          {/* Active Diagnostic Trouble Codes & Safety Alerts */}
          <DtcAlertPanel
            safety={activeVehicle.safety}
            healthScore={activeVehicle.overallHealthScore}
            driverScore={activeVehicle.driverSafetyScore}
            onClearCodes={handleClearCodes}
            onInjectCode={handleInjectCode}
            onInjectHarshBrake={handleInjectHarshBrake}
          />
        </div>
      </div>
    </div>
  );
}
