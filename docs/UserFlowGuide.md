# User Flow Guide

## Investor Journey
- Register via `/auth/register` and verify email.
- Submit KYC information through the dashboard (calls `/api/compliance/kyc`).
- Track KYC status on the dashboard; trading unlocks when status is `approved`.
- Browse active tokens sourced from `/api/tokens/public`.
- Place buy or sell orders via `/api/trading/place-order`; balances update instantly for demo purposes.
- Monitor holdings, valuations, and settlements from the Portfolio view (powered by `/api/portfolio`).

## Issuer Journey
- Register with issuer role and access the issuance workspace.
- Complete the issuance form, uploading legal, valuation, and custody documents; submission triggers `/api/tokens/issue` and stores document hashes.
- Review submission metadata in the confirmation panel and track status updates (pending → approved → active).
- Once approved, view on-chain deployment details (contract address, transaction hash) in the dashboard.

## Admin Journey
- Authenticate with admin credentials and open the Admin Console.
- Review and act on pending KYC requests via `/api/admin/kyc-approval`.
- Inspect issuer submissions, verify hashes, and approve deployment; the backend deploys tokens to Polygon Amoy and updates records.
- Execute compliance actions such as freeze/unfreeze and whitelist updates.
- Export audit logs for reporting and maintain oversight of trading activity.

## Auditor & Regulator Journey
- Access the public verification utility (`/api/verify/hash`) to confirm document integrity.
- Request audit log exports for chronological records of platform activity.
- Validate that on-chain metadata hashes match the approved document set.

## Shared Experience Highlights
- Role-based dashboards adapt to the authenticated user’s permissions.
- All critical events—login, KYC decisions, issuance, trades—are logged to `audit_logs` with severity, timestamps, and IP metadata.
- Demo balances simulate fiat settlement while preserving the structure needed for production integrations.
