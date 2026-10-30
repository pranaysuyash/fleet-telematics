import { useState, useEffect } from 'react';
import { TelematicsVehicleSnapshot, DiagnosticTroubleCode } from '../engine/types';
import {
  INITIAL_FLEET_VEHICLES,
} from '../engine/corridors';
import {
  stepTelematicsSimulation,
  injectHarshBrakingEvent,
  toggleReeferDoor,
  updateReeferSettings,
  injectDiagnosticTroubleCode,
  clearDiagnosticTroubleCodes,
} from '../engine/telematics';
import {
  buildCargoFitTelematicsBridgeUrl,
  buildFreightPricingTelematicsBridgeUrl,
  buildHosPlannerTelematicsBridgeUrl,
  buildAssetStudioTelematicsBridgeUrl,
} from '../engine/bridges';
import { platformBus } from '../engine/platformBus';
import { CrossProjectNav } from './CrossProjectNav';
import { LiveGauges } from './LiveGauges';
import { ColdChainLogger } from './ColdChainLogger';
import { CorridorMapCanvas } from './CorridorMapCanvas';
import { DtcAlertPanel } from './DtcAlertPanel';
import { SuiteDock, isProductLicensed } from './SuiteDock';
import { IconPause, IconPlay } from './icons';
import { MovementTask } from './MovementTask';
import { IftaReportModal } from './IftaReportModal';

export function App() {
  const [fleet, setFleet] = useState<TelematicsVehicleSnapshot[]>(INITIAL_FLEET_VEHICLES);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(INITIAL_FLEET_VEHICLES[0].vehicleId);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x, 5x, 10x
  const [isIftaModalOpen, setIsIftaModalOpen] = useState<boolean>(false);

  // Inbound bridge parameter sync (portal or external bridge)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const vParam = params.get('vehicle') || params.get('unitNumber') || params.get('vehicleId');
    if (vParam) {
      const match = fleet.find(
        (v) =>
          v.vehicleId.toLowerCase().includes(vParam.toLowerCase()) ||
          v.vehicleUnitNumber.toLowerCase().includes(vParam.toLowerCase()) ||
          vParam.toLowerCase().includes(v.vehicleUnitNumber.toLowerCase())
      );
      if (match) setSelectedVehicleId(match.vehicleId);
    }
  }, [fleet]);

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

  const handleUpdateReeferSettings = (settings: { setPointF?: number; compressorMode?: 'continuous' | 'start_stop' }) => {
    updateActiveVehicle((v) => updateReeferSettings(v, settings));
  };

  const handleInjectHarshBrake = () => {
    updateActiveVehicle((v) => injectHarshBrakingEvent(v));
    platformBus.publish(
      'SAFETY_ALERT',
      {
        alertId: `ALT-${Date.now()}`,
        unitNumber: activeVehicle.vehicleUnitNumber,
        category: 'HARSH_BRAKE',
        severity: 'warning',
        message: `Harsh braking event detected on ${activeVehicle.vehicleUnitNumber}: deceleration > 8.5 mph/s near ${activeVehicle.gps.nearestCity}, ${activeVehicle.gps.state}`,
        timestamp: new Date().toISOString(),
      },
      { senderProduct: 'product-05-fleet-telematics', senderPort: 5177 }
    );
  };

  const handleInjectCode = (code: DiagnosticTroubleCode) => {
    updateActiveVehicle((v) => injectDiagnosticTroubleCode(v, code));
    platformBus.publish(
      'SAFETY_ALERT',
      {
        alertId: `DTC-${code.spn}-${Date.now()}`,
        unitNumber: activeVehicle.vehicleUnitNumber,
        category: 'DTC_FAULT',
        severity: code.severity === 'red_stop_engine' ? 'critical' : 'warning',
        message: `SAE J1939 Fault SPN ${code.spn} FMI ${code.fmi}: ${code.description}`,
        timestamp: new Date().toISOString(),
      },
      { senderProduct: 'product-05-fleet-telematics', senderPort: 5177 }
    );
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
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <SuiteDock currentProductId="product-05-fleet-telematics" />
      {/* Platform Cross-Project Navigation Header */}
      <CrossProjectNav /><p style={{ padding: 12 }}>Sensor simulation: values below are generated locally, with no live device connection.</p>

      {/* Main Container */}
      <main id="main-content" className="telematics-content-wrap" tabIndex={-1}>
        <MovementTask />
        <h2 className="simulator-heading">Independent sensor simulator</h2>
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
              {isPlaying ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><IconPause size={12} /> PAUSE</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><IconPlay size={12} /> RESUME LIVE</span>}
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

            <button
              type="button"
              onClick={() => setIsIftaModalOpen(true)}
              style={{
                marginLeft: '8px',
                padding: '5px 10px',
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              IFTA Return 📑
            </button>
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
              <a
                href={p01Url}
                onClick={(e) => {
                  if (!isProductLicensed('product-01-cargo-fit')) {
                    e.preventDefault();
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeVehicle, null, 2));
                    const dl = document.createElement('a');
                    dl.setAttribute('href', dataStr);
                    dl.setAttribute('download', `${activeVehicle.vehicleUnitNumber}-telematics.json`);
                    dl.click();
                    alert(`Exported raw telematics JSON. Cargo Fit is an add-on module ($149/mo).`);
                  }
                }}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-cross-bridge p01"
                title="Compare payload weight vs axle distribution"
              >
                P01 Cargo Fit ↗
              </a>
              <a
                href={p02Url}
                onClick={(e) => {
                  if (!isProductLicensed('product-02-freight-pricing')) {
                    e.preventDefault();
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeVehicle, null, 2));
                    const dl = document.createElement('a');
                    dl.setAttribute('href', dataStr);
                    dl.setAttribute('download', `${activeVehicle.vehicleUnitNumber}-telematics.json`);
                    dl.click();
                    alert(`Exported raw telematics JSON. Freight Pricing is an add-on module ($199/mo).`);
                  }
                }}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-cross-bridge p02"
                title="Feed actual fuel burn rate into freight pricing HUD"
              >
                P02 Pricing ↗
              </a>
              <a
                href={p03Url}
                onClick={(e) => {
                  if (!isProductLicensed('product-03-hos-planner')) {
                    e.preventDefault();
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeVehicle, null, 2));
                    const dl = document.createElement('a');
                    dl.setAttribute('href', dataStr);
                    dl.setAttribute('download', `${activeVehicle.vehicleUnitNumber}-telematics.json`);
                    dl.click();
                    alert(`Exported raw telematics JSON. HOS Planner is an add-on module ($129/mo).`);
                  }
                }}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-cross-bridge p03"
                title="Inspect driver FMCSA 24-hr ELD compliance log"
              >
                P03 HOS ↗
              </a>
              <a
                href={p04Url}
                onClick={(e) => {
                  if (!isProductLicensed('product-04-asset-studio')) {
                    e.preventDefault();
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeVehicle, null, 2));
                    const dl = document.createElement('a');
                    dl.setAttribute('href', dataStr);
                    dl.setAttribute('download', `${activeVehicle.vehicleUnitNumber}-telematics.json`);
                    dl.click();
                    alert(`Exported raw telematics JSON. Asset Studio is an add-on module ($249/mo).`);
                  }
                }}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-cross-bridge p04"
                title="Inspect 3D digital twin of this vehicle asset"
              >
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
          <ColdChainLogger
            coldChain={activeVehicle.coldChain}
            onToggleDoor={handleToggleDoor}
            onUpdateSettings={handleUpdateReeferSettings}
          />

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
      </main>

      <IftaReportModal
        isOpen={isIftaModalOpen}
        onClose={() => setIsIftaModalOpen(false)}
        activeVehicle={activeVehicle}
      />
    </div>
  );
}
