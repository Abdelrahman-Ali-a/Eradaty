import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

export async function GET() {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Calculate monthly budget usage for each wallet
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const wallets = data ?? [];

  for (const wallet of wallets) {
    if (wallet.monthly_budget) {
      const { data: monthlyCosts } = await supabase
        .from("wallet_transactions")
        .select("amount")
        .eq("wallet_id", wallet.id)
        .eq("transaction_type", "cost_deduction")
        .gte("transaction_date", `${currentMonth}-01`)
        .lte("transaction_date", `${currentMonth}-31`);

      const totalCosts = (monthlyCosts || []).reduce((sum, c) => sum + Number(c.amount), 0);
      wallet.monthly_budget_used = totalCosts;
      wallet.monthly_budget_remaining = wallet.monthly_budget - totalCosts;
      wallet.monthly_budget_percentage = (wallet.monthly_budget_remaining / wallet.monthly_budget) * 100;
    } else {
      wallet.monthly_budget_used = 0;
      wallet.monthly_budget_remaining = 0;
      wallet.monthly_budget_percentage = 100;
    }
  }

  return NextResponse.json({ wallets });
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as any;
  if (!body?.name || !body?.type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { error } = await supabase.from("wallets").insert({
    brand_id: brandId,
    name: body.name,
    type: body.type,
    currency: body.currency ?? "EGP",
    current_balance: body.current_balance ?? 0,
    monthly_budget: body.monthly_budget ?? null,
    description: body.description ?? null,
    active: body.active ?? true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
