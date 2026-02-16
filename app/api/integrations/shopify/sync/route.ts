import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";
import { computeOrderMoney, fetchShopifyOrders } from "@/lib/shopify";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const { data: conn, error: connErr } = await supabase
    .from("shopify_connections")
    .select("shop_domain, access_token")
    .eq("brand_id", brandId)
    .single();

  if (connErr) return NextResponse.json({ error: connErr.message }, { status: 400 });

  const days = 90;

  const orders = await fetchShopifyOrders({
    shop: conn.shop_domain,
    accessToken: conn.access_token,
    days
  });

  const rows = orders.map((o: any) => {
    const m = computeOrderMoney(o);
    return {
      brand_id: brandId,
      shop_domain: conn.shop_domain,
      order_id: String(o.id),
      created_at: m.createdAt,
      currency: m.currency,
      gross: m.gross,
      discounts: m.discounts,
      refunds: m.refunds,
      net: m.net,
      raw_json: o
    };
  });

  if (rows.length > 0) {
    const { error } = await supabase.from("shopify_orders").upsert(rows, { onConflict: "brand_id,shop_domain,order_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.from("shopify_connections").update({ updated_at: new Date().toISOString() }).eq("brand_id", brandId);

  return NextResponse.redirect(new URL("/integrations", req.url));
}
