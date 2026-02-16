import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function clampRange(start: string | null, end: string | null) {
  const today = new Date();
  const defEnd = toISODate(today);
  const defStart = toISODate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  return { start: start ?? defStart, end: end ?? defEnd };
}

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const u = new URL(req.url);
  const { start, end } = clampRange(u.searchParams.get("start"), u.searchParams.get("end"));

  const [costsRes, metaRes, ordersRes] = await Promise.all([
    supabase.from("costs").select("date,amount,category").eq("brand_id", brandId).gte("date", start).lte("date", end),
    supabase.from("meta_daily_spend").select("date,spend").eq("brand_id", brandId).gte("date", start).lte("date", end),
    supabase
      .from("shopify_orders")
      .select("created_at,gross,net")
      .eq("brand_id", brandId)
      .gte("created_at", `${start}T00:00:00.000Z`)
      .lte("created_at", `${end}T23:59:59.999Z`)
  ]);

  if (costsRes.error) return NextResponse.json({ error: costsRes.error.message }, { status: 400 });
  if (metaRes.error) return NextResponse.json({ error: metaRes.error.message }, { status: 400 });
  if (ordersRes.error) return NextResponse.json({ error: ordersRes.error.message }, { status: 400 });

  const daily: Record<string, { revenueNet: number; costs: number; profit: number }> = {};
  const byCategory: Record<string, number> = {};

  const ensureDay = (d: string) => {
    if (!daily[d]) daily[d] = { revenueNet: 0, costs: 0, profit: 0 };
    return daily[d];
  };

  let grossRevenue = 0;
  let netRevenue = 0;

  for (const o of ordersRes.data ?? []) {
    const day = String(o.created_at).slice(0, 10);
    grossRevenue += Number(o.gross ?? 0);
    netRevenue += Number(o.net ?? 0);
    ensureDay(day).revenueNet += Number(o.net ?? 0);
  }

  let manualCosts = 0;
  for (const c of costsRes.data ?? []) {
    manualCosts += Number(c.amount ?? 0);
    byCategory[String(c.category)] = (byCategory[String(c.category)] ?? 0) + Number(c.amount ?? 0);
    ensureDay(String(c.date)).costs += Number(c.amount ?? 0);
  }

  let metaCosts = 0;
  for (const m of metaRes.data ?? []) {
    metaCosts += Number(m.spend ?? 0);
    byCategory["meta_ads"] = (byCategory["meta_ads"] ?? 0) + Number(m.spend ?? 0);
    ensureDay(String(m.date)).costs += Number(m.spend ?? 0);
  }

  const startD = new Date(`${start}T00:00:00.000Z`);
  const endD = new Date(`${end}T00:00:00.000Z`);
  for (let d = new Date(startD); d <= endD; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = toISODate(d);
    const row = ensureDay(day);
    row.profit = row.revenueNet - row.costs;
  }

  const dailyArr = Object.entries(daily)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  const totalCosts = manualCosts + metaCosts;
  const profit = netRevenue - totalCosts;

  return NextResponse.json({
    range: { start, end },
    totals: { grossRevenue, netRevenue, totalCosts, profit },
    byCategory,
    daily: dailyArr
  });
}
