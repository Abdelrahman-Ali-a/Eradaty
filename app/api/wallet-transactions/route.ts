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
  if (!body?.wallet_id || !body?.amount || !body?.transaction_type || !body?.transaction_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get wallet
  const { data: wallet } = await supabase
    .from("wallets")
    .select("current_balance")
    .eq("id", body.wallet_id)
    .eq("brand_id", brandId)
    .single();

  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  // Create transaction record
  const { error: txError } = await supabase
    .from("wallet_transactions")
    .insert({
      brand_id: brandId,
      wallet_id: body.wallet_id,
      amount: body.amount,
      transaction_type: body.transaction_type,
      description: body.description,
      transaction_date: body.transaction_date,
    });

  if (txError) return NextResponse.json({ error: txError.message }, { status: 400 });

  // Update wallet balance
  const newBalance = body.transaction_type === "add" 
    ? wallet.current_balance + body.amount 
    : wallet.current_balance - body.amount;

  await supabase
    .from("wallets")
    .update({ current_balance: newBalance })
    .eq("id", body.wallet_id);

  return NextResponse.json({ ok: true });
}
