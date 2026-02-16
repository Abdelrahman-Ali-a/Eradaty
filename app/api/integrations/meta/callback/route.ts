import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";
import { exchangeMetaToken, pickFirstAdAccount } from "@/lib/meta";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.redirect(new URL("/onboarding", req.url));

  const u = new URL(req.url);
  const code = u.searchParams.get("code") ?? "";
  const state = u.searchParams.get("state") ?? "";

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("meta_oauth_state")?.value;

  if (!code || !stateCookie || stateCookie !== state) {
    return NextResponse.redirect(new URL("/integrations", req.url));
  }

  const token = await exchangeMetaToken({
    appId: process.env.META_APP_ID!,
    appSecret: process.env.META_APP_SECRET!,
    redirectUri: process.env.META_REDIRECT_URI!,
    code
  });

  const accessToken = token.access_token;
  const adAccountId = await pickFirstAdAccount(accessToken);
  if (!adAccountId) return NextResponse.redirect(new URL("/integrations", req.url));

  const { error } = await supabase.from("meta_connections").upsert(
    {
      brand_id: brandId,
      ad_account_id: adAccountId,
      access_token: accessToken,
      connected_at: new Date().toISOString()
    },
    { onConflict: "brand_id" }
  );

  if (error) return NextResponse.redirect(new URL("/integrations", req.url));
  return NextResponse.redirect(new URL("/integrations", req.url));
}
