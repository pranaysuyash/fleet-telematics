import type { Shipment, ShipmentAdapter } from '../suite/types';
// Connected departure/arrival are explicit scenario events; standalone sensor
// simulation stays independent and is never substituted for observed GPS.
export const shipmentAdapter: ShipmentAdapter = {};

export function movementPayload(shipment: Shipment, action: 'depart' | 'arrive', tractorId = shipment.input.tractorId) {
  if (tractorId !== shipment.input.tractorId) throw new Error('Choose the assigned tractor before recording movement.');
  if (action === 'depart' && shipment.status !== 'dispatched') throw new Error('Command Center dispatch approval is required before departure.');
  if (action === 'arrive' && shipment.status !== 'in_transit') throw new Error('Record departure before arrival.');
  return { tractorId, source: 'manual_scenario_entry', origin: shipment.input.origin, destination: shipment.input.destination };
}

export function exceptionPayload(message: string) {
  if (!message.trim() || message.length > 500) throw new Error('Enter an exception reason between one and 500 characters.');
  return { message: message.trim(), source: 'manual_scenario_entry' };
}
