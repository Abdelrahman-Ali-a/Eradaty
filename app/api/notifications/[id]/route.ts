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

  const { error } = await supabase
    .from("notifications")
    .update({
      read: body.read ?? undefined,
    })
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
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("brand_id", brandId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
