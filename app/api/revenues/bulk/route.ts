import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

export async function POST(req: Request) {
    const supabase = await supabaseServer();
    const user = await requireUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const brandId = await requireBrandId(supabase, user.id);
    if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const validItems = items.map((item: any) => {
        // Normalize keys to lowercase
        const normalized: any = {};
        Object.keys(item).forEach(key => {
            normalized[key.toLowerCase().trim()] = item[key];
        });

        let dateStr = normalized.date;
        // Attempt parse
        // Excel serial date to JS Date (basic approximation)
        if (typeof dateStr === 'number') {
            const millis = (dateStr - 25569) * 86400 * 1000;
            const parsed = new Date(Math.round(millis));
            if (!isNaN(parsed.getTime())) {
                dateStr = parsed.toISOString();
            } else {
                dateStr = new Date().toISOString();
            }
        } else if (dateStr) {
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) dateStr = parsed.toISOString();
            else dateStr = new Date().toISOString();
        } else {
            dateStr = new Date().toISOString();
        }

        return {
            brand_id: brandId,
            date: dateStr,
            amount: parseFloat(normalized.amount) || 0,
            source: normalized.source || "Bulk",
            customer_name: normalized.customer || normalized.customer_name || null,
            description: normalized.description || normalized.note || null,
            photo_url: null
        };
    }).filter(i => i.amount > 0);

    if (validItems.length === 0) {
        return NextResponse.json({ error: "No valid items found (amount > 0 required)" }, { status: 400 });
    }

    // Bulk insert
    const { data, error } = await supabase.from("manual_revenues").insert(validItems).select();

    if (error) {
        console.error("Bulk insert revenue error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, count: data?.length || 0 });
}
