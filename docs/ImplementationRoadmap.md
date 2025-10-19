# Implementation Roadmap

## ERC-3643 Adoption

### Phase A — Assessment & Design (Weeks 1-2)
- **Spec Review** Study ERC-3643 components (IdentityRegistry, Compliance, Token) from https://github.com/ERC-3643.
- **Gap Analysis** Compare current `contracts/SecurityToken.sol` and Supabase schema with ERC-3643 requirements.
- **Data Mapping** Design linkage between KYC records (`users` table) and on-chain identity registry entries, including DID strategy and privacy safeguards.
- **Governance Model** Define admin roles for registry updates and compliance policy changes.

### Phase B — Prototype Build (Weeks 3-6)
- **Smart Contracts** Implement or adapt ERC-3643-compliant contracts; configure deployment scripts (`lib/blockchain/tokenFactory.ts`) to deploy IdentityRegistry, ComplianceManager, and Token.
- **API Extensions** Update issuance and KYC routes to sync registry entries and compliance status.
- **Frontend Enhancements** Display registry status badges, compliance policies, and DID references within dashboards.
- **Testing** Execute Hardhat test suite for identity and compliance flows; perform end-to-end walkthrough across investor, issuer, and admin personas.

### Phase C — Validation & Rollout (Weeks 7-9)
- **Security Review** Run static analysis, enlist third-party auditors for smart contract validation.
- **Sandbox Demonstration** Prepare regulator demo scripts showcasing identity-linked transfers, automated compliance blocks, and audit evidence.
- **Documentation** Update architectural briefs and user guides to reflect ERC-3643 migration.

## Prototype-Ready Enhancements

### Stream 1 — Identity & Compliance (Weeks 1-4)
- **Off-chain Registry Stub** Create Supabase tables for identity registry mirrors; integrate KYC approval updates.
- **Verification Badges** Surface proof-of-KYC status on the dashboard, aligning with future DID implementation.
- **Compliance Rules Engine** Store jurisdiction/investor policies in Supabase and enforce them in trading APIs.

### Stream 2 — Market Experience (Weeks 2-5)
- **Order Lifecycle States** Extend `orders` schema with maker/taker flags, partial fills, and escrow indicators.
- **Telemetry UI** Visualize order state transitions and settlement summaries in investor/admin dashboards.
- **INR Ledger Simulation** Introduce mock INR balances alongside demo credits to prepare for UPI integration.

### Stream 3 — Governance & Reporting (Weeks 3-6)
- **Audit Dashboard** Build admin widgets summarizing `audit_logs` by severity and recent events.
- **Issuer Metadata Preview** Enhance issuance confirmation with hash summaries and cap-table snapshots.
- **Documentation & Training** Publish updated user/regulator guides (see `docs/`), and script demo scenarios for stakeholders.

### Deliverables & Milestones
- Weekly checkpoints with demo builds.
- Final review at Week 9 combining ERC-3643 prototype contracts, enhanced dashboards, and updated documentation for sandbox submission.
