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
  const includeShopify = u.searchParams.get("include_shopify") === "true";

  // Get manual revenues
  const { data: manualRevenues, error: manualError } = await supabase
    .from("manual_revenues")
    .select("id,date,amount,source,customer_name,description,photo_url")
    .eq("brand_id", brandId)
    .order("date", { ascending: false })
    .limit(100);

  if (manualError) return NextResponse.json({ error: manualError.message }, { status: 400 });

  let shopifyOrders = [];
  if (includeShopify) {
    const { data: orders } = await supabase
      .from("shopify_orders")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(100);
    
    shopifyOrders = orders ?? [];
  }

  return NextResponse.json({ 
    manual: manualRevenues ?? [],
    shopify: shopifyOrders 
  });
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as any;
  if (!body?.date || body?.amount == null || !body?.source) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { error } = await supabase.from("manual_revenues").insert({
    brand_id: brandId,
    date: body.date,
    amount: body.amount,
    source: body.source,
    customer_name: body.customer_name ?? null,
    description: body.description ?? null,
    photo_url: body.photo_url ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
