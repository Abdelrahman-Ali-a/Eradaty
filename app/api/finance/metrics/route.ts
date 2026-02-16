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

  // Calculate period days
  const startDate = new Date(start);
  const endDate = new Date(end);
  const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Fetch cash transactions
  const { data: transactions, error: txError } = await supabase
    .from("cash_transactions")
    .select("section, category, amount, date")
    .eq("brand_id", brandId)
    .gte("date", start)
    .lte("date", end);

  if (txError) return NextResponse.json({ error: txError.message }, { status: 400 });

  // Calculate cash flow by section
  let operatingCashFlow = 0;
  let investingCashFlow = 0;
  let financingCashFlow = 0;
  let sales = 0;
  let cogs = 0;
  let taxes = 0;

  (transactions ?? []).forEach((tx) => {
    const amount = Number(tx.amount);
    
    if (tx.section === "operating") {
      operatingCashFlow += amount;
      
      // Track sales (orders + subscriptions)
      if (tx.category === "orders" || tx.category === "subscriptions") {
        sales += Math.abs(amount);
      }
      
      // Track COGS (inventory + shipping + packaging)
      if (tx.category === "inventory_purchase" || tx.category === "shipping_fulfillment" || tx.category === "packaging") {
        cogs += Math.abs(amount);
      }
      
      // Track taxes
      if (tx.category === "taxes") {
        taxes += Math.abs(amount);
      }
    } else if (tx.section === "investing") {
      investingCashFlow += amount;
    } else if (tx.section === "financing") {
      financingCashFlow += amount;
    }
  });

  const totalCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
  const operatingProfit = operatingCashFlow;
  const netProfit = operatingProfit - taxes;
  const netProfitMargin = sales > 0 ? (netProfit / sales) * 100 : 0;

  // Fetch latest working capital snapshot
  const { data: wcSnapshot } = await supabase
    .from("working_capital_snapshots")
    .select("*")
    .eq("brand_id", brandId)
    .lte("snapshot_date", end)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch latest equity snapshot
  const { data: equitySnapshot } = await supabase
    .from("equity_snapshots")
    .select("*")
    .eq("brand_id", brandId)
    .lte("snapshot_date", end)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch total assets
  const { data: assets } = await supabase
    .from("assets")
    .select("current_value")
    .eq("brand_id", brandId)
    .is("sale_date", null);

  const totalAssets = (assets ?? []).reduce((sum, a) => sum + Number(a.current_value ?? 0), 0);

  // Calculate efficiency metrics
  const inventory = Number(wcSnapshot?.inventory ?? 0);
  const accountsReceivable = Number(wcSnapshot?.accounts_receivable ?? 0);
  const accountsPayable = Number(wcSnapshot?.accounts_payable ?? 0);
  const totalEquity = Number(equitySnapshot?.total_equity ?? 0);

  const dio = cogs > 0 ? (inventory / cogs) * 365 : 0;
  const dso = sales > 0 ? (accountsReceivable / sales) * periodDays : 0;
  const dpo = cogs > 0 ? (accountsPayable / cogs) * 365 : 0;
  const ccc = dio + dso - dpo;

  // Calculate profitability ratios
  const roe = totalEquity > 0 ? (netProfit / totalEquity) * 100 : 0;
  const roa = totalAssets > 0 ? (netProfit / totalAssets) * 100 : 0;
  const roi = cogs > 0 ? ((sales - cogs) / cogs) * 100 : 0;

  return NextResponse.json({
    range: { start, end, periodDays },
    cashFlow: {
      operating: operatingCashFlow,
      investing: investingCashFlow,
      financing: financingCashFlow,
      total: totalCashFlow,
    },
    profitability: {
      sales,
      cogs,
      operatingProfit,
      taxes,
      netProfit,
      netProfitMargin,
      roi,
      roe,
      roa,
    },
    efficiency: {
      dio,
      dso,
      dpo,
      ccc,
    },
    balanceSheet: {
      totalAssets,
      totalEquity,
      inventory,
      accountsReceivable,
      accountsPayable,
      cash: Number(wcSnapshot?.cash ?? 0),
    },
  });
}
