import { useState } from 'react';
import { exceptionPayload, movementPayload } from '../engine/shipmentAdapter';
import { useShipmentSession } from '../suite/ShipmentSession';
import { useShipmentDraft } from '../suite/useShipmentDraft';

export function MovementTask() {
  const session = useShipmentSession();
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const draft = useShipmentDraft({ value: reason, importValue: () => '', applyValue: setReason });
  if (!session?.selectedId) return draft.detached ? <p className="execution-task-note">Detached movement draft retained. Reconnect a shipment to record an event.</p> : null;
  const shipment = session.shipment;
  if (!shipment) return <section className="execution-task"><h2>Shipment movement</h2><p>Loading the selected shipment.</p></section>;
  const record = async (action: 'depart' | 'arrive' | 'exception.open') => {
    try {
      if (!draft.canSubmit || !draft.basis) throw new Error('Load the current shipment before recording this action.');
      const payload = action === 'exception.open' ? exceptionPayload(reason) : movementPayload(shipment, action);
      const next = await session.submit(action, payload, draft.basis.revision);
      if (next) { draft.acknowledge(next, reason); setNotice(action === 'exception.open' ? 'Scenario exception recorded. Resolve it in Command Center.' : `Scenario ${action === 'depart' ? 'departure' : 'arrival'} recorded for ${shipment.input.tractorId}.`); }
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Movement could not be saved.'); }
  };
  const events = shipment.events.filter(event => ['depart', 'arrive'].includes(event.type));
  return <section className="execution-task" aria-labelledby="movement-task-title">
    <div className="execution-task-heading"><div><span className="execution-eyebrow">SHIPMENT EXECUTION · MANUAL LOCAL SCENARIO</span><h2 id="movement-task-title">Record shipment movement</h2></div><button onClick={() => session.inspect('shipment')}>Inspect movement record</button></div>
    <p><strong>{shipment.input.tractorId}</strong> · {shipment.input.origin} → {shipment.input.destination} · <strong>{shipment.status.replaceAll('_', ' ')}</strong></p>
    <p className="execution-task-note">Departure and arrival below are explicit scenario declarations. Sensor animation is independent and does not establish GPS, driving time or physical arrival.</p>
    {draft.incoming && <p role="status">The shared shipment changed. Your exception draft is retained. <button onClick={draft.loadCurrent}>Load current shipment</button></p>}
    {draft.error && <p role="alert">{draft.error}</p>}
    <div className="execution-actions"><button disabled={!draft.canSubmit || shipment.status !== 'dispatched'} onClick={() => record('depart')}>Record scenario departure</button><button disabled={!draft.canSubmit || shipment.status !== 'in_transit'} onClick={() => record('arrive')}>Record scenario arrival</button><a href={session.productUrl('command-center-portal')}>Dispatch and exception recovery</a><a href={session.productUrl('product-06-warehouse-space-flow')}>Open receiving task</a></div>
    <details><summary>Planned route and recorded movement ({events.length})</summary><p>Declared route: {shipment.input.loadedMiles} loaded miles and {shipment.input.deadheadMiles} deadhead miles. No planned departure, arrival or live ETA has been declared.</p>{events.length ? <ol>{events.map(event => <li key={event.id}><button onClick={() => session.inspect(`event:${event.id}`)}>{event.type === 'depart' ? 'Departure' : 'Arrival'} · {new Date(event.at).toLocaleString()}</button><span> · recorded by {event.productId}; manually entered local scenario</span></li>)}</ol> : <p>No movement event recorded.</p>}</details>
    <label className="execution-field">Exception reason<textarea value={reason} maxLength={500} onChange={event => { setReason(event.target.value); setNotice(''); }} placeholder="Describe the delay, damage or other exception" /></label>
    <button disabled={!draft.canSubmit || !reason.trim() || shipment.status === 'invoice_ready'} onClick={() => record('exception.open')}>Report shipment exception</button>
    {notice && <p role="status">{notice}</p>}
  </section>;
}
