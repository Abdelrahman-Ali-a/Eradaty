import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";
import { exchangeShopifyToken, verifyShopifyHmac } from "@/lib/shopify";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.redirect(new URL("/onboarding", req.url));

  const u = new URL(req.url);
  const shop = (u.searchParams.get("shop") ?? "").toLowerCase();
  const code = u.searchParams.get("code") ?? "";
  const hmac = u.searchParams.get("hmac") ?? "";
  const state = u.searchParams.get("state") ?? "";

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("shopify_oauth_state")?.value;
  const shopCookie = cookieStore.get("shopify_oauth_shop")?.value;

  if (!shop || !code || !hmac || !stateCookie || stateCookie !== state || shopCookie !== shop) {
    return NextResponse.redirect(new URL("/integrations", req.url));
  }

  // Get API credentials from database
  const { data: connection } = await supabase
    .from("shopify_connections")
    .select("api_key, api_secret")
    .eq("brand_id", brandId)
    .maybeSingle();

  if (!connection?.api_key || !connection?.api_secret) {
    return NextResponse.redirect(new URL("/integrations?error=no_credentials", req.url));
  }

  const query: Record<string, string> = {};
  u.searchParams.forEach((v, k) => (query[k] = v));

  const ok = verifyShopifyHmac(query, connection.api_secret);
  if (!ok) return NextResponse.redirect(new URL("/integrations", req.url));

  const token = await exchangeShopifyToken({
    shop,
    clientId: connection.api_key,
    clientSecret: connection.api_secret,
    code
  });

  const accessToken = token.access_token;
  const scopes = token.scope;

  const { error } = await supabase.from("shopify_connections").upsert(
    {
      brand_id: brandId,
      shop_domain: shop,
      access_token: accessToken,
      scopes,
      connected_at: new Date().toISOString()
    },
    { onConflict: "brand_id" }
  );

  if (error) return NextResponse.redirect(new URL("/integrations", req.url));
  return NextResponse.redirect(new URL("/integrations", req.url));
}
