import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const { id } = await ctx.params;

  // Fetch cost details
  const { data: cost, error } = await supabase
    .from("costs")
    .select("*")
    .eq("id", id)
    .eq("brand_id", brandId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Fetch line items
  const { data: lineItems } = await supabase
    .from("cost_line_items")
    .select("*")
    .eq("cost_id", id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ ...cost, line_items: lineItems || [] });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as any;

  const { error } = await supabase
    .from("costs")
    .update({
      date: body?.date,
      amount: body?.amount,
      category: body?.category,
      vendor: body?.vendor ?? null,
      note: body?.note ?? null,
      recurring: body?.recurring ?? null
    })
    .eq("id", id)
    .eq("brand_id", brandId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Update line items if provided
  if (body.line_items && Array.isArray(body.line_items)) {
    // Delete existing items
    await supabase.from("cost_line_items").delete().eq("cost_id", id);

    if (body.line_items.length > 0) {
      // Insert new items
      const itemsToInsert = body.line_items.map((item: any, index: number) => ({
        cost_id: id,
        brand_id: brandId,
        item_name: item.name,
        description: item.description ?? null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        sku: item.sku ?? null,
        tax_amount: item.tax ?? null,
        sort_order: index
      }));

      await supabase.from("cost_line_items").insert(itemsToInsert);
    }
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

  const { error } = await supabase.from("costs").delete().eq("id", id).eq("brand_id", brandId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
