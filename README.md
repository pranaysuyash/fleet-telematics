# Product 05 — Fleet Telematics & Real-Time Tracking HUD

**Active Port:** `5177`  
**Sovereign Directory:** `products/product-05-fleet-telematics/`

---

## Overview
Product 05 is a high-frequency tactical telematics dashboard and real-time monitoring engine for commercial fleet operations. It simulates and visualizes SAE J1939 CAN bus OBD-II powertrain data, cold-chain refrigeration temperatures, GPS corridor progress, and diagnostic trouble codes (DTC).

---

## Core Capabilities

1. **SAE J1939 CAN Bus Engine Telemetry:**
   - Digital gauges for Vehicle Speed (MPH), Engine Tachometer (RPM), Engine Coolant Temp (°F), and Engine Oil Pressure (PSI).
   - Fuel and Diesel Exhaust Fluid (DEF) level tracking.
   - Real-time instantaneous and average fuel economy (MPG).
   - Battery voltage and transmission gear monitoring.

2. **Cold-Chain Reefer Data Logger:**
   - Dual-zone setpoint, internal temperature, and return air tracking.
   - Interactive cargo door toggle simulating thermal dissipation (+0.15°F/sec).
   - Automated FSMA temperature excursion alert classification (`normal`, `caution`, `critical`).

3. **GPS Corridor & Waypoint Geofencing:**
   - Real-time schematic tracking along Interstate corridors (e.g. I-80 Joliet to Salt Lake City).
   - Automated waypoint interpolation across terminals, weigh stations, and rest stops.
   - Geofence status detection (`en_route`, `weigh_station`, `rest_stop`, `at_destination`).

4. **Safety & Diagnostic Trouble Codes (DTC):**
   - Active J1939 DTC fault logging with SPN, FMI, severity (`amber_warning`, `red_stop_engine`), and ECU source.
   - Fault injection buttons for simulated low coolant (SPN 111) and stop engine oil pressure (SPN 100).
   - Harsh braking (>8.5 mph/s deceleration), harsh acceleration, and excess idle event counters.
   - Dynamic vehicle health score (0-100) and driver safety score (0-100).

5. **Cross-Project Platform Integration:**
   - Deep links to Product 01 (Cargo Fit), Product 02 (Freight Pricing HUD), Product 03 (HOS Planner), and Product 04 (Asset Studio).

---

## Development & Testing

```bash
# Start local development server on port 5177
npm run dev

# Run unit tests
npm test

# Build production bundle
npm run build

# Run typecheck
npm run typecheck
```
