import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  let query = supabase
    .from("costs")
    .select("id,date,amount,category,vendor,note,recurring")
    .eq("brand_id", brandId)
    .order("date", { ascending: false });

  if (startDate) {
    query = query.gte("date", startDate);
  }
  if (endDate) {
    query = query.lte("date", endDate);
  }

  const { data, error } = await query.limit(1000);

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
      category: body?.category,
      hasLineItems: !!body?.line_items?.length,
      hasOCRData: !!body?.ocr_data
    });

    if (!body?.date || body?.amount == null || !body?.category) {
      console.log('❌ Missing fields:', { body });
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Insert cost with OCR data
    const { data: costData, error: costError } = await supabase.from("costs").insert({
      brand_id: brandId,
      date: body.date,
      amount: body.amount,
      category: body.category,
      vendor: body.vendor ?? null,
      note: body.note ?? body.description ?? null,
      recurring: (body.recurring === 'weekly' || body.recurring === 'monthly') ? body.recurring : null,
      source: "manual",
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

    if (costError) {
      console.log('❌ Database error:', costError);
      return NextResponse.json({ error: costError.message }, { status: 400 });
    }

    console.log('✅ Cost inserted successfully:', costData.id);

    // Insert line items if provided
    if (body.line_items && Array.isArray(body.line_items) && body.line_items.length > 0) {
      const lineItemsToInsert = body.line_items.map((item: any, index: number) => ({
        cost_id: costData.id,
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
        .from("cost_line_items")
        .insert(lineItemsToInsert);

      if (lineItemsError) {
        console.log('⚠️ Line items error:', lineItemsError);
        // Don't fail the whole request if line items fail
      } else {
        console.log(`✅ Inserted ${lineItemsToInsert.length} line items`);
      }
    }

    // If deduct_from_wallet is true, deduct from basic wallet
    if (body.deduct_from_wallet) {
      console.log('💰 Starting wallet deduction...');
      // Rest of the wallet deduction code...
    }

    return NextResponse.json({ ok: true, cost_id: costData.id });
  } catch (error) {
    console.log('❌ API Error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
