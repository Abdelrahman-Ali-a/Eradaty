import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as any;

  // If setting as default/basic, first unset all other wallets
  if (body.is_default === true || body.is_basic === true) {
    // We only update is_basic because is_default column might not exist yet
    await supabase
      .from("wallets")
      .update({ is_basic: false })
      .eq("brand_id", brandId);
  }

  const updateData: any = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.current_balance !== undefined) updateData.current_balance = body.current_balance;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;

  // Map is_default from frontend to is_basic in database
  if (body.is_default !== undefined) {
    updateData.is_basic = body.is_default;
  }
  if (body.is_basic !== undefined) {
    updateData.is_basic = body.is_basic;
  }

  const { error } = await supabase
    .from("wallets")
    .update(updateData)
    .eq("id", id)
    .eq("brand_id", brandId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as any;

  const updateData: any = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.current_balance !== undefined) updateData.current_balance = body.current_balance;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;
  if (body.is_basic !== undefined) updateData.is_basic = body.is_basic;

  const { error } = await supabase
    .from("wallets")
    .update(updateData)
    .eq("id", id)
    .eq("brand_id", brandId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
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
    .from("wallets")
    .delete()
    .eq("id", id)
    .eq("brand_id", brandId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
