# Telematics evidence review, 2026-11-06

## Findings and decisions

The reefer controls only mutate local scenario state, but previously reported an acknowledged gateway command and displayed live/over-the-air language. Commands now report `SIMULATED`, explicitly say that no controller was contacted, and retain their useful local controls and history. Tire summary thresholds remain scenario flags, not CVSA or legal determinations; `allTiresLegal` is unknown. No hardware, provider, or customer state was contacted.

The ingestion adapter previously filled missing sensor readings with seemingly healthy values and treated missing fault data as normal. Optional sensor readings and reefer excursion now remain unknown when absent or non-finite; a missing setpoint is also unknown, not assumed to be -10°F. Missing DTC or thermal evidence yields unknown overall severity unless an observed warning or critical alert is present. The configured three-degree setpoint threshold is an application scenario rule, not a statutory determination. The adapter does not authenticate the origin or validate device identity or timestamps, and its existing J1939 mappings require authoritative protocol and provider verification before integration.

## Evidence and limits

P05 `npm test`: 6 files, 34 tests pass; `npm run typecheck`: pass. Before correction the missing-reading, legal-status and command-acknowledgement tests reproduced four failures; a separate setpoint regression reproduced the undeclared -10°F assumption. After correction they pass. These are software tests only, not physical sensors, controller acknowledgement, connected-provider integration, browser/device acceptance, or safety/legal certification. A future real command flow requires a separately authenticated provider adapter, correlation and genuine acknowledgement semantics, timeouts, and replay handling.
