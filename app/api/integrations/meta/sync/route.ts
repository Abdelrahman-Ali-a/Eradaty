import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";
import { fetchInsightsDailyAdset, getAdAccountCurrency } from "@/lib/meta";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const { data: conn, error: connErr } = await supabase
    .from("meta_connections")
    .select("ad_account_id, access_token")
    .eq("brand_id", brandId)
    .single();

  if (connErr) return NextResponse.json({ error: connErr.message }, { status: 400 });

  const days = 30;
  const currency = await getAdAccountCurrency(conn.access_token, conn.ad_account_id);

  const rows = await fetchInsightsDailyAdset({
    accessToken: conn.access_token,
    adAccountId: conn.ad_account_id,
    days
  });

  const upserts = (rows ?? [])
    .map((r: any) => ({
      brand_id: brandId,
      ad_account_id: conn.ad_account_id,
      date: String(r.date_start),
      currency,
      spend: Number(r.spend ?? 0),
      campaign_id: String(r.campaign_id ?? ""),
      campaign_name: r.campaign_name ?? null,
      adset_id: String(r.adset_id ?? ""),
      adset_name: r.adset_name ?? null
    }))
    .filter((x: any) => x.campaign_id && x.adset_id && x.date);

  if (upserts.length > 0) {
    const { error } = await supabase
      .from("meta_daily_spend")
      .upsert(upserts, { onConflict: "brand_id,ad_account_id,date,campaign_id,adset_id" });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.from("meta_connections").update({ updated_at: new Date().toISOString() }).eq("brand_id", brandId);

  return NextResponse.redirect(new URL("/integrations", req.url));
}
