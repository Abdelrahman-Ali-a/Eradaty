import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

export async function GET() {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const { data: shopify } = await supabase
    .from("shopify_connections")
    .select("shop_domain, updated_at, api_key, api_secret")
    .eq("brand_id", brandId)
    .maybeSingle();

  const { data: meta } = await supabase
    .from("meta_connections")
    .select("ad_account_id, updated_at")
    .eq("brand_id", brandId)
    .maybeSingle();

  return NextResponse.json({
    shopify: shopify ? {
      shop_domain: shopify.shop_domain,
      updated_at: shopify.updated_at,
      api_key: shopify.api_key ? "***" : null, // Mask the actual key
      api_secret: shopify.api_secret ? "***" : null, // Mask the actual secret
    } : null,
    meta: meta || null,
  });
}
