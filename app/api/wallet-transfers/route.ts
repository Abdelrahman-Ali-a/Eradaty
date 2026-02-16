import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as any;
  if (!body?.from_wallet_id || !body?.to_wallet_id || !body?.amount || !body?.transfer_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get from wallet
  const { data: fromWallet } = await supabase
    .from("wallets")
    .select("current_balance")
    .eq("id", body.from_wallet_id)
    .eq("brand_id", brandId)
    .single();

  if (!fromWallet) {
    return NextResponse.json({ error: "Source wallet not found" }, { status: 404 });
  }

  if (fromWallet.current_balance < body.amount) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  // Create transfer record
  const { error: transferError } = await supabase
    .from("wallet_transfers")
    .insert({
      brand_id: brandId,
      from_wallet_id: body.from_wallet_id,
      to_wallet_id: body.to_wallet_id,
      amount: body.amount,
      description: body.description,
      transfer_date: body.transfer_date,
    });

  if (transferError) return NextResponse.json({ error: transferError.message }, { status: 400 });

  // Update wallet balances
  await supabase
    .from("wallets")
    .update({ current_balance: fromWallet.current_balance - body.amount })
    .eq("id", body.from_wallet_id);

  const { data: toWallet } = await supabase
    .from("wallets")
    .select("current_balance")
    .eq("id", body.to_wallet_id)
    .single();

  if (toWallet) {
    await supabase
      .from("wallets")
      .update({ current_balance: toWallet.current_balance + body.amount })
      .eq("id", body.to_wallet_id);
  }

  return NextResponse.json({ ok: true });
}
