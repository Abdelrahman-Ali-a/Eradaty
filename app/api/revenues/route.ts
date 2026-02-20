import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const u = new URL(req.url);
  const includeShopify = u.searchParams.get("include_shopify") === "true";
  const startDate = u.searchParams.get("startDate");
  const endDate = u.searchParams.get("endDate");

  // Get manual revenues
  let manualQuery = supabase
    .from("manual_revenues")
    .select("id,date,amount,source,customer_name,description,photo_url")
    .eq("brand_id", brandId)
    .order("date", { ascending: false });

  if (startDate) manualQuery = manualQuery.gte("date", startDate);
  if (endDate) manualQuery = manualQuery.lte("date", endDate);

  const { data: manualRevenues, error: manualError } = await manualQuery.limit(1000);

  if (manualError) return NextResponse.json({ error: manualError.message }, { status: 400 });

  let shopifyOrders = [];
  if (includeShopify) {
    let shopifyQuery = supabase
      .from("shopify_orders")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });

    if (startDate) shopifyQuery = shopifyQuery.gte("created_at", startDate);
    if (endDate) shopifyQuery = shopifyQuery.lte("created_at", endDate);

    const { data: orders } = await shopifyQuery.limit(1000);

    shopifyOrders = orders ?? [];
  }

  return NextResponse.json({
    manual: manualRevenues ?? [],
    shopify: shopifyOrders,
  });
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as any;
  if (!body?.date || body?.amount == null || !body?.source) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Insert revenue with OCR data
  const { data: revenueData, error: revenueError } = await supabase.from("manual_revenues").insert({
    brand_id: brandId,
    date: body.date,
    amount: body.amount,
    source: body.source,
    customer_name: body.customer_name ?? body.customer ?? null,
    description: body.description ?? null,
    photo_url: body.photo_url ?? null,
    // OCR fields
    attachment_url: body.attachment_url ?? null,
    attachment_storage_path: body.attachment_storage_path ?? null,
    ocr_confidence: body.ocr_confidence ?? null,
    ocr_extracted_data: body.ocr_data ?? null,
    invoice_number: body.invoice_number ?? null,
    invoice_currency: body.invoice_currency ?? null,
    invoice_subtotal: body.invoice_subtotal ?? null,
    invoice_tax: body.invoice_tax ?? null,
    invoice_total: body.invoice_total ?? null,
  }).select().single();

  if (revenueError) return NextResponse.json({ error: revenueError.message }, { status: 400 });

  console.log('✅ Revenue inserted successfully:', revenueData.id);

  // Insert line items if provided
  if (body.line_items && Array.isArray(body.line_items) && body.line_items.length > 0) {
    const lineItemsToInsert = body.line_items.map((item: any, index: number) => ({
      revenue_id: revenueData.id,
      brand_id: brandId,
      item_name: item.name,
      description: item.description ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
      sku: item.sku ?? null,
      tax_amount: item.tax ?? null,
      sort_order: index,
    }));

    const { error: lineItemsError } = await supabase
      .from("revenue_line_items")
      .insert(lineItemsToInsert);

    if (lineItemsError) {
      console.log('⚠️ Line items error:', lineItemsError);
      // Don't fail the whole request if line items fail
    } else {
      console.log(`✅ Inserted ${lineItemsToInsert.length} line items`);
    }
  }

  return NextResponse.json({ ok: true, revenue_id: revenueData.id });
}
