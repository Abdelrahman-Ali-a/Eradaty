import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as any;

  // Update salary payment
  const { error: paymentError } = await supabase
    .from("salary_payments")
    .update({
      amount: body.amount,
      payment_date: body.payment_date,
      period_month: body.period_month,
      note: body.note,
    })
    .eq("id", id)
    .eq("brand_id", brandId);

  if (paymentError) return NextResponse.json({ error: paymentError.message }, { status: 400 });

  // Check if this payment has an approved pending cost
  const { data: pendingCost } = await supabase
    .from("pending_costs")
    .select("*")
    .eq("salary_payment_id", id)
    .eq("status", "approved")
    .single();

  // If approved, update the corresponding cost entry
  if (pendingCost) {
    await supabase
      .from("costs")
      .update({
        amount: body.amount,
        date: body.payment_date,
        note: body.note,
      })
      .eq("brand_id", brandId)
      .eq("date", pendingCost.payment_date)
      .eq("amount", pendingCost.amount);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const { id } = await ctx.params;

  const { error } = await supabase
    .from("salary_payments")
    .delete()
    .eq("id", id)
    .eq("brand_id", brandId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
