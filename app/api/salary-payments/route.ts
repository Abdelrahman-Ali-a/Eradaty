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
    .from("salary_payments")
    .select("*, employees(name, position)")
    .eq("brand_id", brandId)
    .order("payment_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ payments: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as any;
  if (!body?.employee_id || body?.amount == null || !body?.payment_date || !body?.period_month) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get employee details for notification
  const { data: employee } = await supabase
    .from("employees")
    .select("name")
    .eq("id", body.employee_id)
    .single();

  // Create salary payment
  const { data: payment, error: paymentError } = await supabase
    .from("salary_payments")
    .insert({
      brand_id: brandId,
      employee_id: body.employee_id,
      payment_date: body.payment_date,
      amount: body.amount,
      period_month: body.period_month,
      note: body.note ?? null,
    })
    .select()
    .single();

  if (paymentError) return NextResponse.json({ error: paymentError.message }, { status: 400 });

  // Create pending cost for admin approval
  const { data: pendingCost, error: pendingError } = await supabase
    .from("pending_costs")
    .insert({
      brand_id: brandId,
      employee_id: body.employee_id,
      salary_payment_id: payment.id,
      amount: body.amount,
      category: "salaries",
      description: `Salary payment for ${employee?.name || 'employee'} - ${body.period_month}`,
      payment_date: body.payment_date,
      status: "pending",
    })
    .select()
    .single();

  if (pendingError) return NextResponse.json({ error: pendingError.message }, { status: 400 });

  // Send notification to admin
  await supabase
    .from("notifications")
    .insert({
      brand_id: brandId,
      type: "payment",
      title: "Pending Salary Payment",
      message: `Salary payment of ${body.amount} for ${employee?.name || 'employee'} (${body.period_month}) is pending approval`,
      action_url: "/costs",
      read: false,
    });

  return NextResponse.json({ ok: true, pending_cost_id: pendingCost.id });
}
