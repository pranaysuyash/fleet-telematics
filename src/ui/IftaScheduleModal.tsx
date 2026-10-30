import React, { useMemo } from 'react';
import {
  aggregateCorridorJurisdictionMiles,
  generateIftaQuarterlyReturn,
  FuelPurchaseRecord,
} from '../engine/iftaCompliance';
import { CORRIDOR_I80 } from '../engine/corridors';

interface IftaScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMile: number;
}

export const IftaScheduleModal: React.FC<IftaScheduleModalProps> = ({
  isOpen,
  onClose,
  currentMile,
}) => {
  const simulatedFuelPurchases: FuelPurchaseRecord[] = useMemo(
    () => [
      {
        id: 'FP-101',
        timestamp: '2026-10-24T08:30:00Z',
        stateCode: 'IL',
        city: 'Moline',
        gallonsPurchased: 50,
        pricePerGallon: 4.85,
        totalPaidUsd: 242.5,
        fuelStopName: "Pilot Flying J #412",
      },
      {
        id: 'FP-102',
        timestamp: '2026-10-24T14:15:00Z',
        stateCode: 'IA',
        city: 'Des Moines',
        gallonsPurchased: 70,
        pricePerGallon: 4.45,
        totalPaidUsd: 311.5,
        fuelStopName: "Love's Travel Stop #682",
      },
      {
        id: 'FP-103',
        timestamp: '2026-10-24T20:00:00Z',
        stateCode: 'NE',
        city: 'North Platte',
        gallonsPurchased: 85,
        pricePerGallon: 4.52,
        totalPaidUsd: 384.2,
        fuelStopName: "TA Travel Center #119",
      },
    ],
    []
  );

  const report = useMemo(() => {
    const segments = aggregateCorridorJurisdictionMiles(CORRIDOR_I80, currentMile);
    return generateIftaQuarterlyReturn(
      'DOT-892104',
      '1FUJGLDR5NLBH9821',
      '2026-Q3',
      segments,
      simulatedFuelPurchases,
      6.5 // Fleet average 6.5 MPG
    );
  }, [currentMile, simulatedFuelPurchases]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ifta-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-container"
        style={{
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: 12,
          maxWidth: 740,
          width: '100%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 id="ifta-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              IFTA-100 Quarterly Fuel Tax Schedule &amp; Jurisdictional Mileage
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
              Automated GPS state-line crossings, fuel purchase credits &amp; excise tax reconciliation
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
              color: '#64748b',
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

        {/* Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Total Fleet Miles</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{report.totalFleetMiles}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Across 5 Jurisdictions</div>
            </div>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Fuel Economy (MPG)</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0284c7', margin: '4px 0' }}>{report.compositeMpg}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Fleet Baseline</div>
            </div>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Tax Paid at Pump</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a', margin: '4px 0' }}>${report.totalTaxCreditUsd.toFixed(2)}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Credit on 205 Gallons</div>
            </div>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Net IFTA Balance</div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: report.netBalanceDueUsd > 0 ? '#dc2626' : '#16a34a',
                  margin: '4px 0',
                }}
              >
                ${Math.abs(report.netBalanceDueUsd).toFixed(2)}
              </div>
              <div style={{ fontSize: 11, color: report.netBalanceDueUsd > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                {report.netBalanceDueUsd > 0 ? 'NET TAX DUE' : 'NET REFUND CREDIT'}
              </div>
            </div>
          </div>

          {/* Jurisdictional Table */}
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: '4px 0 0', color: '#0f172a' }}>
            Jurisdiction Mileage &amp; Tax Reconciliation Schedule (IFTA-100)
          </h3>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>State / Jurisdiction</th>
                  <th style={{ padding: '8px 12px' }}>Total Miles</th>
                  <th style={{ padding: '8px 12px' }}>Taxable Gal</th>
                  <th style={{ padding: '8px 12px' }}>Tax-Paid Gal</th>
                  <th style={{ padding: '8px 12px' }}>Net Gal</th>
                  <th style={{ padding: '8px 12px' }}>Tax Rate</th>
                  <th style={{ padding: '8px 12px' }}>Tax Due / (Credit)</th>
                </tr>
              </thead>
              <tbody>
                {report.lineItems.map((item) => (
                  <tr key={item.stateCode} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                      {item.stateName} ({item.stateCode})
                    </td>
                    <td style={{ padding: '8px 12px' }}>{item.totalMiles}</td>
                    <td style={{ padding: '8px 12px' }}>{item.taxableGallons}</td>
                    <td style={{ padding: '8px 12px' }}>{item.taxPaidGallons}</td>
                    <td style={{ padding: '8px 12px' }}>{item.netTaxableGallons}</td>
                    <td style={{ padding: '8px 12px' }}>${item.taxRatePerGallon.toFixed(3)}</td>
                    <td
                      style={{
                        padding: '8px 12px',
                        fontWeight: 700,
                        color: item.taxDueOrCreditUsd > 0 ? '#dc2626' : '#15803d',
                      }}
                    >
                      {item.taxDueOrCreditUsd < 0 ? `($${Math.abs(item.taxDueOrCreditUsd).toFixed(2)})` : `$${item.taxDueOrCreditUsd.toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', background: '#f8fafc', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0' }}>
            {report.statutoryCertification}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Close IFTA Schedule
          </button>
        </div>
      </div>
    </div>
  );
};
