import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/client";

const FALLBACK_TOKENS = [
  {
    id: "mock-gold",
    name: "Heritage Gold Trust",
    symbol: "HGT",
    status: "active",
    assetType: "Gold",
    totalSupply: 100000,
    decimals: 2,
    issuer: "FinX Token Labs Pvt Ltd",
    issuerRegistration: "U12345GJ2024PTC000001",
    assetDescription: "Fractional ownership in LBMA-certified gold bars stored in SEZ vaults.",
    valuation: 685000000,
    valuationDate: new Date().toISOString(),
    custodianName: "IFS Vault Custody Services",
    documentHashes: {
      custodyProof: "hash-custody-gold",
      legalDocument: "hash-legal-gold",
      valuationReport: "hash-valuation-gold",
    },
    metadataHash: "hash-metadata-gold",
    contractAddress: null,
    mintTxHash: null,
    chainId: 80002,
    isFrozen: false,
    freezeReason: null,
    approvedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mock-re",
    name: "GIFT City Commercial Tower",
    symbol: "GCT",
    status: "active",
    assetType: "Real Estate",
    totalSupply: 500000,
    decimals: 2,
    issuer: "FinX Token Labs Pvt Ltd",
    issuerRegistration: "U12345GJ2024PTC000001",
    assetDescription: "Fractionalized Grade-A office tower leased to fintech tenants in GIFT City.",
    valuation: 2450000000,
    valuationDate: new Date().toISOString(),
    custodianName: "IFS Real Assets Trustee",
    documentHashes: {
      custodyProof: "hash-custody-re",
      legalDocument: "hash-legal-re",
      valuationReport: "hash-valuation-re",
    },
    metadataHash: "hash-metadata-re",
    contractAddress: null,
    mintTxHash: null,
    chainId: 80002,
    isFrozen: false,
    freezeReason: null,
    approvedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function transformTokens(data: any[]) {
  return data.map((token) => ({
    id: token.id,
    name: token.token_name ?? token.name,
    symbol: token.token_symbol ?? token.symbol,
    status: token.status,
    assetType: token.asset_type ?? token.assetType,
    totalSupply: Number(token.total_supply ?? token.totalSupply ?? 0),
    decimals: token.decimals,
    issuer: token.issuer_legal_name ?? token.issuer,
    issuerRegistration: token.issuer_registration_number ?? token.issuerRegistration ?? null,
    assetDescription: token.asset_description ?? token.assetDescription ?? null,
    valuation: token.asset_valuation !== undefined ? Number(token.asset_valuation) : token.valuation ?? null,
    valuationDate: token.asset_valuation_date ?? token.valuationDate ?? null,
    custodianName: token.custodian_name ?? token.custodianName ?? null,
    documentHashes: {
      custodyProof: token.custody_proof_hash ?? token.documentHashes?.custodyProof ?? null,
      legalDocument: token.legal_doc_hash ?? token.documentHashes?.legalDocument ?? null,
      valuationReport: token.valuation_report_hash ?? token.documentHashes?.valuationReport ?? null,
    },
    metadataHash: token.metadata_hash ?? token.metadataHash ?? null,
    contractAddress: token.contract_address ?? token.contractAddress ?? null,
    mintTxHash: token.mint_tx_hash ?? token.mintTxHash ?? null,
    chainId: token.chain_id ?? token.chainId ?? null,
    isFrozen: token.is_frozen ?? token.isFrozen ?? false,
    freezeReason: token.freeze_reason ?? token.freezeReason ?? null,
    approvedAt: token.approved_at ?? token.approvedAt ?? null,
    createdAt: token.created_at ?? token.createdAt ?? null,
    updatedAt: token.updated_at ?? token.updatedAt ?? null,
  }));
}

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ success: true, tokens: transformTokens(FALLBACK_TOKENS), fallback: true }, { status: 200 });
  }

  const { data, error } = await supabaseAdmin
    .from("tokens")
    .select(
      "id, token_symbol, token_name, asset_type, total_supply, decimals, issuer_legal_name, issuer_registration_number, asset_description, asset_valuation, asset_valuation_date, custodian_name, custody_proof_hash, legal_doc_hash, valuation_report_hash, metadata_hash, contract_address, mint_tx_hash, chain_id, status, is_frozen, freeze_reason, created_at, updated_at, approved_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Public token fetch error:", error);
    return NextResponse.json({ success: true, tokens: transformTokens(FALLBACK_TOKENS), fallback: true }, { status: 200 });
  }

  const source = data && data.length > 0 ? data : FALLBACK_TOKENS;
  const tokens = transformTokens(source);

  return NextResponse.json({ success: true, tokens, fallback: !data || data.length === 0 }, { status: 200 });
}
