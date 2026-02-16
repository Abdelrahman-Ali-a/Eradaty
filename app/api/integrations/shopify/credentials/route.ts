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
  if (!body?.api_key || !body?.api_secret || !body?.redirect_uri) {
    return NextResponse.json({ error: "API key, secret, and redirect URI are required" }, { status: 400 });
  }

  // Check if connection exists
  const { data: existing } = await supabase
    .from("shopify_connections")
    .select("id")
    .eq("brand_id", brandId)
    .maybeSingle();

  if (existing) {
    // Update existing connection
    const { error } = await supabase
      .from("shopify_connections")
      .update({
        api_key: body.api_key,
        api_secret: body.api_secret,
        redirect_uri: body.redirect_uri,
        scopes: "read_orders,read_products",
      })
      .eq("brand_id", brandId);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    // Create new connection
    const { error } = await supabase
      .from("shopify_connections")
      .insert({
        brand_id: brandId,
        api_key: body.api_key,
        api_secret: body.api_secret,
        redirect_uri: body.redirect_uri,
        scopes: "read_orders,read_products",
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
