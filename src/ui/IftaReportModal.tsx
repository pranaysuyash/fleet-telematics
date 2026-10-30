import React, { useMemo } from 'react';
import {
  aggregateCorridorJurisdictionMiles,
  generateIftaQuarterlyReturn,
  type FuelPurchaseRecord,
} from '../engine/iftaCompliance';
import { CORRIDOR_I80 } from '../engine/corridors';
import type { TelematicsVehicleSnapshot } from '../engine/types';

interface IftaReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeVehicle: TelematicsVehicleSnapshot;
}

export const IftaReportModal: React.FC<IftaReportModalProps> = ({
  isOpen,
  onClose,
  activeVehicle,
}) => {
  // Sample historical fuel card purchases for the vehicle
  const mockPurchases: FuelPurchaseRecord[] = useMemo(() => [
    {
      id: 'fp-101',
      timestamp: '2026-10-22T08:14:00Z',
      stateCode: 'IL',
      city: 'Morris',
      gallonsPurchased: 75.0,
      pricePerGallon: 3.92,
      totalPaidUsd: 294.00,
      fuelStopName: 'TA Travel Center #112',
    },
    {
      id: 'fp-102',
      timestamp: '2026-10-23T16:45:00Z',
      stateCode: 'IA',
      city: 'Des Moines',
      gallonsPurchased: 120.0,
      pricePerGallon: 3.79,
      totalPaidUsd: 454.80,
      fuelStopName: 'Pilot Flying J #204',
    },
    {
      id: 'fp-103',
      timestamp: '2026-10-25T11:30:00Z',
      stateCode: 'NE',
      city: 'North Platte',
      gallonsPurchased: 110.0,
      pricePerGallon: 3.74,
      totalPaidUsd: 411.40,
      fuelStopName: 'Love’s Travel Stop #618',
    },
    {
      id: 'fp-104',
      timestamp: '2026-10-26T14:10:00Z',
      stateCode: 'WY',
      city: 'Rock Springs',
      gallonsPurchased: 90.0,
      pricePerGallon: 3.69,
      totalPaidUsd: 332.10,
      fuelStopName: 'Little America Fuel Depot',
    },
  ], []);

  const currentMile = Math.min(1390, Math.round(activeVehicle.gps.mileMarker || 0));
  const segments = useMemo(() => aggregateCorridorJurisdictionMiles(CORRIDOR_I80, currentMile), [currentMile]);
  const iftaReport = useMemo(() => {
    return generateIftaQuarterlyReturn(
      segments,
      mockPurchases,
      activeVehicle.engine.averageMpg || 6.9,
      {
        carrierDot: 'USDOT-389104',
        vin: activeVehicle.vin,
        quarter: '2026-Q3',
      }
    );
  }, [segments, mockPurchases, activeVehicle]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ifta-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: 12,
          maxWidth: 820,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid #334155',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #1e293b',
            background: '#1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 id="ifta-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#38bdf8' }}>
              IFTA-100 Statutory Interstate Fuel Tax Schedule
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94a3b8' }}>
              Unit: <b>{activeVehicle.vehicleUnitNumber}</b> · VIN: <span style={{ fontFamily: 'monospace' }}>{activeVehicle.vin}</span> · Corridor: I-80 Midwest-Intermountain
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#94a3b8',
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Summary Metric Ribbon */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            padding: '14px 24px',
            background: '#0b1120',
            borderBottom: '1px solid #1e293b',
            fontSize: 12,
          }}
        >
          <div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>TOTAL CORRIDOR MILES</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>{iftaReport.totalFleetMiles.toLocaleString()} mi</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>FLEET AVG FUEL ECONOMY</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#38bdf8' }}>{iftaReport.compositeMpg} MPG</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>TAXABLE GALLONS BURNED</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>{iftaReport.totalFuelGallons.toLocaleString()} gal</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>NET IFTA BALANCE</div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: iftaReport.netBalanceDueUsd > 0 ? '#f87171' : '#34d399',
              }}
            >
              {iftaReport.netBalanceDueUsd > 0 ? `-$${iftaReport.netBalanceDueUsd.toFixed(2)} DUE` : `+$${Math.abs(iftaReport.netBalanceDueUsd).toFixed(2)} CREDIT`}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
            JURISDICTIONAL MILEAGE &amp; EXCISE TAX RECONCILIATION
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: 11 }}>
                <th style={{ padding: '8px 6px' }}>STATE</th>
                <th style={{ padding: '8px 6px', textAlign: 'right' }}>TOTAL MILES</th>
                <th style={{ padding: '8px 6px', textAlign: 'right' }}>TAXABLE GAL</th>
                <th style={{ padding: '8px 6px', textAlign: 'right' }}>TAX-PAID GAL</th>
                <th style={{ padding: '8px 6px', textAlign: 'right' }}>NET TAXABLE</th>
                <th style={{ padding: '8px 6px', textAlign: 'right' }}>TAX RATE</th>
                <th style={{ padding: '8px 6px', textAlign: 'right' }}>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {iftaReport.lineItems.map((item) => (
                <tr key={item.stateCode} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '8px 6px', fontWeight: 600 }}>
                    <span style={{ color: '#38bdf8' }}>{item.stateCode}</span> — {item.stateName}
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {item.totalMiles.toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {item.taxableGallons.toFixed(1)}
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {item.taxPaidGallons.toFixed(1)}
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {item.netTaxableGallons > 0 ? `+${item.netTaxableGallons.toFixed(1)}` : item.netTaxableGallons.toFixed(1)}
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'monospace' }}>
                    ${item.taxRatePerGallon.toFixed(3)}
                  </td>
                  <td
                    style={{
                      padding: '8px 6px',
                      textAlign: 'right',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: item.taxDueOrCreditUsd > 0 ? '#f87171' : item.taxDueOrCreditUsd < 0 ? '#34d399' : '#94a3b8',
                    }}
                  >
                    {item.taxDueOrCreditUsd > 0 ? `$${item.taxDueOrCreditUsd.toFixed(2)}` : item.taxDueOrCreditUsd < 0 ? `-$${Math.abs(item.taxDueOrCreditUsd).toFixed(2)}` : '$0.00'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 6,
              background: '#1e293b',
              border: '1px solid #334155',
              fontSize: 11,
              color: '#94a3b8',
              lineHeight: 1.5,
            }}
          >
            🛡️ <b>Statutory Compliance Note:</b> {iftaReport.statutoryCertification} Fleet distances are derived from continuous SAE J1939 odometer broadcasts and geofenced state-line waypoint crossings.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #1e293b',
            background: '#1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            onClick={() => {
              const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(iftaReport, null, 2));
              const dl = document.createElement('a');
              dl.setAttribute('href', dataStr);
              dl.setAttribute('download', `IFTA-100-${activeVehicle.vehicleUnitNumber}-Q3.json`);
              dl.click();
            }}
            style={{
              padding: '8px 16px',
              background: '#334155',
              color: '#38bdf8',
              border: '1px solid #475569',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 40,
            }}
          >
            Export IFTA JSON
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 40,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
