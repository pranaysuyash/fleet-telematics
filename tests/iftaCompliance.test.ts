import { describe, it, expect } from 'vitest';
import {
  aggregateCorridorJurisdictionMiles,
  generateIftaQuarterlyReturn,
  IFTA_STATE_RATES,
  type FuelPurchaseRecord,
} from '../src/engine/iftaCompliance';
import { CORRIDOR_I80 } from '../src/engine/corridors';

describe('P05 IFTA Statutory Fuel Tax Aggregator & Compliance Engine', () => {
  it('correctly aggregates miles per state along the I-80 corridor at midway', () => {
    // Current mile: 500 (Omaha, NE region)
    // Route waypoints:
    // Joliet (0, IL) -> Moline (155, IL) -> Des Moines (330, IA) -> Omaha (468, NE) -> North Platte (742, NE)
    const segments = aggregateCorridorJurisdictionMiles(CORRIDOR_I80, 500);

    const il = segments.find((s) => s.stateCode === 'IL');
    const ia = segments.find((s) => s.stateCode === 'IA');
    const ne = segments.find((s) => s.stateCode === 'NE');

    expect(il).toBeDefined();
    expect(il?.traveledMiles).toBe(155);
    expect(il?.isComplete).toBe(true);

    expect(ia).toBeDefined();
    // IA runs from Moline (155) to Omaha (468): 468 - 155 = 313 miles
    expect(ia?.traveledMiles).toBe(313);
    expect(ia?.isComplete).toBe(true);

    expect(ne).toBeDefined();
    // NE: 500 - 468 = 32 miles
    expect(ne?.traveledMiles).toBe(32);
    expect(ne?.isComplete).toBe(false);
  });

  it('calculates full corridor jurisdiction mileage at completion', () => {
    const segments = aggregateCorridorJurisdictionMiles(CORRIDOR_I80, 1390);
    const totalMiles = segments.reduce((sum, s) => sum + s.traveledMiles, 0);

    expect(totalMiles).toBe(1390);
    expect(segments.map((s) => s.stateCode)).toContain('IL');
    expect(segments.map((s) => s.stateCode)).toContain('IA');
    expect(segments.map((s) => s.stateCode)).toContain('NE');
    expect(segments.map((s) => s.stateCode)).toContain('WY');
  });

  it('computes IFTA quarterly tax due and credits balancing fuel purchases against consumption', () => {
    const segments = aggregateCorridorJurisdictionMiles(CORRIDOR_I80, 1390);

    // Simulated fuel purchases:
    // 100 gallons bought in Iowa ($0.325/gal tax)
    // 150 gallons bought in Wyoming ($0.240/gal tax)
    const fuelPurchases: FuelPurchaseRecord[] = [
      {
        id: 'fp-1',
        timestamp: '2026-10-25T14:30:00Z',
        stateCode: 'IA',
        city: 'Des Moines',
        gallonsPurchased: 100,
        pricePerGallon: 3.85,
        totalPaidUsd: 385.00,
        fuelStopName: 'Pilot Flying J #384',
      },
      {
        id: 'fp-2',
        timestamp: '2026-10-26T09:15:00Z',
        stateCode: 'WY',
        city: 'Cheyenne',
        gallonsPurchased: 150,
        pricePerGallon: 3.75,
        totalPaidUsd: 562.50,
        fuelStopName: 'Love’s Travel Stop #512',
      },
    ];

    const report = generateIftaQuarterlyReturn(segments, fuelPurchases, 6.5, {
      carrierDot: 'USDOT-1049281',
      vin: '1FUJGLDR5NLBH9821',
      quarter: '2026-Q3',
    });

    expect(report.carrierDotNumber).toBe('USDOT-1049281');
    expect(report.totalFleetMiles).toBe(1390);
    expect(report.compositeMpg).toBe(6.5);
    expect(report.lineItems.length).toBeGreaterThanOrEqual(4);

    // Illinois had miles driven but 0 fuel purchases, so Illinois tax is OWED
    const ilItem = report.lineItems.find((item) => item.stateCode === 'IL');
    expect(ilItem).toBeDefined();
    expect(ilItem?.status).toBe('OWED');
    expect(ilItem?.taxDueOrCreditUsd).toBeGreaterThan(0);
    expect(ilItem?.taxRatePerGallon).toBe(IFTA_STATE_RATES.IL.dieselTaxRatePerGallon);

    // Statutory audit certification statement present
    expect(report.statutoryCertification).toContain('IFTA Articles of Agreement');
  });
});
