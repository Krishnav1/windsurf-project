# Regulatory Architecture Brief

## Platform Overview
- **Objective** Deliver a sandbox-ready asset tokenization prototype demonstrating compliant onboarding, issuance, trading, and auditing flows.
- **Stakeholders** Investors, issuers, administrators, auditors/regulators.
- **Operating Model** Centralized application logic with anchored blockchain evidence and auditable records.

## Component Stack
- **Client Experience** Next.js front-end (`app/`) delivering persona-specific dashboards.
- **Service Layer** Next.js API routes (`app/api/`) implementing authentication, compliance, issuance, trading, portfolio analytics, public verification, and admin operations.
- **Data Persistence** Supabase PostgreSQL storing user profiles, KYC payloads, token metadata, orders, portfolios, transactions, and audit logs with Row Level Security for client interactions.
- **Blockchain Interface** Polygon Amoy (Testnet) smart contracts deployed via Ethers v6; contract artifacts maintained in `artifacts/` and logic in `contracts/SecurityToken.sol` with deployment utilities in `lib/blockchain/tokenFactory.ts`.

## Network & Hosting Footprint
- **Frontend Hosting** Vercel (prototype) or equivalent managed hosting for Next.js.
- **Backend Execution** Next.js serverless functions or Node runtime, configurable for Railway or similar.
- **Database** Supabase (managed PostgreSQL) with encryption at rest and configurable access policies.
- **Blockchain** Polygon Amoy testnet RPC via Alchemy (environment variables defined in `.env.local`).
- **Key Management** Development wallets stored locally; production roadmap advocates HSM or custody partner integration.

## Compliance Controls
- **KYC Lifecycle** Investors submit documents through `/api/compliance/kyc`; admin adjudication occurs via `/api/admin/kyc-approval`, updating status, reviewer metadata, and audit entries.
- **Access Security** Password hashing (bcrypt), JWT tokens (7-day expiry), optional TOTP-based 2FA, and role-based access enforcement across APIs.
- **Audit Logging** Every critical action persists to `audit_logs` with user ID, action, resource references, IP, agent, and severity for immutable trails.
- **Document Integrity** SHA-256 hashes stored in `tokens` metadata; public verification endpoint `/api/verify/hash` enables independent validation against on-chain anchors.
- **Trading Safeguards** Orders validated for KYC approvals, token status, whitelist/freeze flags before execution; demo settlement recorded in `transactions`.

## Reporting & Transparency
- **Regulatory Access** Admin portal exports audit logs; verification endpoint supports third-party review; dashboards provide cap-table style insights for issuers and aggregate metrics for administrators.
- **Sandbox Support** Documentation pack includes `UserFlowGuide.md`, this architecture brief, and planned implementation roadmap detailing future upgrades (ERC-3643, payment integrations).
- **Data Governance** Prototype maintains audit-ready trails and supports segregation of sensitive payloads (documents stored off-chain; hashes stored on-chain).

## Future Readiness
- **Identity Registry** Planned ERC-3643 alignment to connect KYC approvals with on-chain identity registries.
- **Payment Integrations** Roadmap includes UPI/CBDC settlement layers, escrow wallet management, and automated reconciliation.
- **Security Enhancements** Hardware key storage, SIEM integration, rate limiting, and VAPT engagements prior to production launch.

The architecture ensures regulators can trace every asset lifecycle event from user onboarding through token deployment and trading, with verifiable evidence preserved both on-chain and in the audit datastore.
