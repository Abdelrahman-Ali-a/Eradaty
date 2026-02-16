import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";
import { shopifyAuthUrl } from "@/lib/shopify";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.redirect(new URL("/onboarding", req.url));

  const u = new URL(req.url);
  const shop = (u.searchParams.get("shop") ?? "").trim().toLowerCase();
  if (!shop.endsWith(".myshopify.com")) {
    return NextResponse.redirect(new URL("/integrations", req.url));
  }

  // Get API credentials from database
  const { data: connection } = await supabase
    .from("shopify_connections")
    .select("api_key, scopes, redirect_uri")
    .eq("brand_id", brandId)
    .maybeSingle();

  if (!connection?.api_key || !connection?.redirect_uri) {
    return NextResponse.redirect(new URL("/integrations?error=no_credentials", req.url));
  }

  const state = crypto.randomBytes(16).toString("hex");
  
  const res = NextResponse.redirect(
    shopifyAuthUrl({
      shop,
      clientId: connection.api_key,
      scopes: connection.scopes || "read_orders,read_products",
      redirectUri: connection.redirect_uri,
      state
    })
  );

  res.cookies.set("shopify_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/" });
  res.cookies.set("shopify_oauth_shop", shop, { httpOnly: true, sameSite: "lax", path: "/" });

  return res;
}
