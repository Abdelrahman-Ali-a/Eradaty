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

  // Fetch revenue details
  const { data: revenue, error } = await supabase
    .from("manual_revenues")
    .select("*")
    .eq("id", id)
    .eq("brand_id", brandId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Fetch line items
  const { data: lineItems } = await supabase
    .from("revenue_line_items")
    .select("*")
    .eq("revenue_id", id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ ...revenue, line_items: lineItems || [] });
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
    .from("manual_revenues")
    .update({
      date: body?.date,
      amount: body?.amount,
      source: body?.source,
      customer_name: body?.customer_name ?? body?.customer ?? null,
      description: body?.description ?? null,
    })
    .eq("id", id)
    .eq("brand_id", brandId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Update line items if provided
  if (body.line_items && Array.isArray(body.line_items)) {
    // Delete existing items
    await supabase.from("revenue_line_items").delete().eq("revenue_id", id);

    if (body.line_items.length > 0) {
      // Insert new items
      const itemsToInsert = body.line_items.map((item: any, index: number) => ({
        revenue_id: id,
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

      await supabase.from("revenue_line_items").insert(itemsToInsert);
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

  const { error } = await supabase
    .from("manual_revenues")
    .delete()
    .eq("id", id)
    .eq("brand_id", brandId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
