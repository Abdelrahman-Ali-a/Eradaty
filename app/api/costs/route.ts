import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

export async function GET() {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const { data, error } = await supabase
    .from("costs")
    .select("id,date,amount,category,vendor,note,recurring")
    .eq("brand_id", brandId)
    .order("date", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ costs: data ?? [] });
}

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const user = await requireUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const brandId = await requireBrandId(supabase, user.id);
    if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

    const body = (await req.json().catch(() => null)) as any;
    console.log('🚀 POST /api/costs received:', {
      hasBody: !!body,
      deductFromWallet: body?.deduct_from_wallet,
      amount: body?.amount,
      category: body?.category
    });
    
    if (!body?.date || body?.amount == null || !body?.category) {
      console.log('❌ Missing fields:', { body });
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Insert cost
    const { error } = await supabase.from("costs").insert({
      brand_id: brandId,
      date: body.date,
      amount: body.amount,
      category: body.category,
      vendor: body.vendor ?? null,
      note: body.note ?? null,
      recurring: body.recurring ?? null,
      source: "manual"
    });

    if (error) {
      console.log('❌ Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('✅ Cost inserted successfully');

    // If deduct_from_wallet is true, deduct from basic wallet
    if (body.deduct_from_wallet) {
      console.log('� Starting wallet deduction...');
      // Rest of the wallet deduction code...
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.log('❌ API Error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
