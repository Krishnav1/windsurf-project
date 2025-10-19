import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/client";
import { verifyToken } from "@/lib/utils/auth";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const decoded = verifyToken(token);

  if (!decoded) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Database connection not available" }, { status: 500 });
  }

  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("id", decoded.userId)
      .single();

    if (userError || !user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { data: tokensData, error: tokensError } = await supabaseAdmin
      .from("tokens")
      .select(
        "id, token_name, token_symbol, status, total_supply, issuer_id, issuer_legal_name, metadata_hash, contract_address, created_at, approved_at, asset_type"
      )
      .order("created_at", { ascending: false });

    if (tokensError) {
      throw tokensError;
    }

    const tokens = tokensData ?? [];

    const metrics = {
      totalTokens: tokens.length,
      activeTokens: tokens.filter((token) => token.status === "active").length,
      pendingTokens: tokens.filter((token) => token.status === "pending").length,
      totalSupplyActive: tokens
        .filter((token) => token.status === "active" || token.status === "approved")
        .reduce((acc, token) => acc + Number(token.total_supply ?? 0), 0),
      uniqueIssuers: new Set(tokens.map((token) => token.issuer_id).filter(Boolean)).size,
    };

    const { data: usersData, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, role, kyc_status")
      .eq("is_active", true);

    if (usersError) {
      throw usersError;
    }

    const users = usersData ?? [];

    const userStats = {
      totalInvestors: users.filter((u) => u.role === "investor").length,
      totalIssuers: users.filter((u) => u.role === "issuer").length,
      pendingKYC: users.filter((u) => u.kyc_status === "pending").length,
      approvedKYC: users.filter((u) => u.kyc_status === "approved").length,
    };

    const { data: transactionsData, error: transactionsError } = await supabaseAdmin
      .from("transactions")
      .select("id, transaction_type, quantity, price, total_amount, settlement_status, blockchain_tx_hash, created_at, token_id")
      .order("created_at", { ascending: false })
      .limit(6);

    if (transactionsError) {
      throw transactionsError;
    }

    const tokenMap = new Map(tokens.map((token) => [token.id, token]));

    const recentTransactions = (transactionsData ?? []).map((tx) => {
      const tokenRef = tx.token_id ? tokenMap.get(tx.token_id) : undefined;
      return {
        id: tx.id,
        type: tx.transaction_type,
        quantity: tx.quantity,
        price: tx.price,
        totalAmount: tx.total_amount,
        settlementStatus: tx.settlement_status,
        blockchainTxHash: tx.blockchain_tx_hash,
        createdAt: tx.created_at,
        token: tokenRef
          ? {
              id: tokenRef.id,
              name: tokenRef.token_name,
              symbol: tokenRef.token_symbol,
            }
          : null,
      };
    });

    const { data: auditLogsData, error: auditError } = await supabaseAdmin
      .from("audit_logs")
      .select("id, action, resource_type, severity, details, created_at")
      .order("created_at", { ascending: false })
      .limit(6);

    if (auditError) {
      throw auditError;
    }

    const recentTokens = tokens.slice(0, 6).map((token) => ({
      id: token.id,
      name: token.token_name,
      symbol: token.token_symbol,
      status: token.status,
      metadataHash: token.metadata_hash,
      contractAddress: token.contract_address,
      createdAt: token.created_at,
      assetType: token.asset_type,
    }));

    return NextResponse.json({
      success: true,
      metrics,
      userStats,
      recentTokens,
      recentTransactions,
      auditLogs: auditLogsData ?? [],
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    return NextResponse.json({ error: "Failed to compute admin overview" }, { status: 500 });
  }
}
