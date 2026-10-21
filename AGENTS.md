# Product 05 — Fleet Telematics & Real-Time Tracking HUD

## 1. Instruction Hierarchy & Governance
This directory governs Product 05 (Fleet Telematics) of the TRUCKING platform.
Precedence:
1. `/Users/pranay/AGENTS.md`
2. `/Users/pranay/Projects/AGENTS.md`
3. `/Users/pranay/Projects/trucking/AGENTS.md`
4. This file (`products/product-05-fleet-telematics/AGENTS.md`)
5. Local `OPERATING_DOCTRINE.md`

Compatibility symlinks (`CLAUDE.md`, `GEMINI.md`, `QWEN.md`) must point directly to this file.

---

## 2. Product Identity & Domain Boundary
- **Port:** `5177`
- **Focus:** Real-time SAE J1939 CAN bus OBD-II engine telemetry (RPM, speed, coolant temp, oil pressure, DEF level, fuel level, instantaneous/average MPG), cold-chain reefer data logger with door-open thermal intrusion & FSMA critical excursion alerts, GPS interstate corridor waypoints & geofencing, active Diagnostic Trouble Code (DTC) fault management, and composite vehicle health & driver safety scoring.
- **Tech Stack:** React 19, TypeScript, Vite 7, Vitest 3.

---

## 3. Sovereign Verification Commands
```bash
npm test        # Run 6 Vitest tests
npm run build   # Typecheck and production bundle build
npm run dev     # Start local server on port 5177
```

---

## 4. Cross-Project Bridges
- **Produces:** Live axle load comparison to Product 01 (Cargo Fit · Port 5173); actual fuel economy (MPG) to Product 02 (Freight Pricing · Port 5174); ELD motion status to Product 03 (HOS Planner · Port 5175); digital twin telemetry link to Product 04 (Asset Studio · Port 5176).

---

## 5. Git & Mutation Policy
- Read-only inspection is permitted (`git status`, `git diff`, `git log`).
- Staging, commits, pushes, and branch changes require explicit user authorization.
