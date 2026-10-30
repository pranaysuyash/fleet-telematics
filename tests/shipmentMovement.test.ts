import { describe, expect, it } from 'vitest';
import { exceptionPayload, movementPayload } from '../src/engine/shipmentAdapter';
import type { Shipment } from '../src/suite/types';

function fixture(status: Shipment['status']): Shipment {
  return { status, input: { tractorId: 'ASSIGNED-001', origin: 'Origin', destination: 'Destination' } } as Shipment;
}

describe('Explicit shipment movement independent of sensor animation', () => {
  it('records only the assigned tractor and declares manual scenario provenance', () => {
    expect(movementPayload(fixture('dispatched'), 'depart')).toEqual({ tractorId: 'ASSIGNED-001', source: 'manual_scenario_entry', origin: 'Origin', destination: 'Destination' });
    expect(() => movementPayload(fixture('dispatched'), 'depart', 'ANIMATED-DEMO-TRUCK')).toThrow(/assigned tractor/);
  });
  it.each(['draft', 'in_transit', 'arrived', 'delivered', 'invoice_ready'] as const)('requires dispatch before departure from %s', status => {
    expect(() => movementPayload(fixture(status), 'depart')).toThrow(/dispatch approval/);
  });
  it.each(['draft', 'dispatched', 'arrived', 'delivered', 'invoice_ready'] as const)('requires departure before arrival from %s', status => {
    expect(() => movementPayload(fixture(status), 'arrive')).toThrow(/departure before arrival/);
  });
  it('allows arrival only for an in-transit shipment', () => {
    expect(movementPayload(fixture('in_transit'), 'arrive').source).toBe('manual_scenario_entry');
  });
  it('retains a user-defined exception reason and rejects empty or oversized entries', () => {
    expect(exceptionPayload('  Damaged wrapping awaiting review  ')).toEqual({ message: 'Damaged wrapping awaiting review', source: 'manual_scenario_entry' });
    expect(() => exceptionPayload(' ')).toThrow(/exception reason/);
    expect(() => exceptionPayload('x'.repeat(501))).toThrow(/exception reason/);
  });
});
