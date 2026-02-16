import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const u = new URL(req.url);
  const type = u.searchParams.get("type");

  if (type === "equity") {
    const { data, error } = await supabase
      .from("equity_snapshots")
      .select("*")
      .eq("brand_id", brandId)
      .order("snapshot_date", { ascending: false })
      .limit(10);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ snapshots: data ?? [] });
  }

  if (type === "working-capital") {
    const { data, error } = await supabase
      .from("working_capital_snapshots")
      .select("*")
      .eq("brand_id", brandId)
      .order("snapshot_date", { ascending: false })
      .limit(10);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ snapshots: data ?? [] });
  }

  if (type === "assets") {
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("brand_id", brandId)
      .order("purchase_date", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ assets: data ?? [] });
  }

  return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as any;
  const type = body?.type;

  if (type === "equity") {
    const { error } = await supabase.from("equity_snapshots").insert({
      brand_id: brandId,
      snapshot_date: body.snapshot_date,
      total_equity: body.total_equity,
      retained_earnings: body.retained_earnings ?? 0,
      owner_capital: body.owner_capital ?? 0,
      note: body.note ?? null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (type === "working-capital") {
    const { error } = await supabase.from("working_capital_snapshots").insert({
      brand_id: brandId,
      snapshot_date: body.snapshot_date,
      inventory: body.inventory ?? 0,
      accounts_receivable: body.accounts_receivable ?? 0,
      accounts_payable: body.accounts_payable ?? 0,
      cash: body.cash ?? 0,
      note: body.note ?? null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (type === "asset") {
    const { error } = await supabase.from("assets").insert({
      brand_id: brandId,
      name: body.name,
      category: body.category,
      purchase_date: body.purchase_date,
      purchase_amount: body.purchase_amount,
      current_value: body.current_value ?? body.purchase_amount,
      depreciation_rate: body.depreciation_rate ?? null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
}
