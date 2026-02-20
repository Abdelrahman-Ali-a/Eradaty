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

        // Basic validation & transformation
        let dateStr = normalized.date;
        // Attempt to parse Excel serial date or string
        if (typeof dateStr === 'number') {
            // Excel serial date to JS Date
            dateStr = new Date(Math.round((dateStr - 25569) * 86400 * 1000)).toISOString();
        } else if (dateStr) {
            // Try parsing string
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
            category: normalized.category || "Uncategorized", // Consider mapping if category IDs are used? User said category is text now.
            vendor: normalized.vendor || null,
            note: normalized.description || normalized.note || null,
            recurring: normalized.recurring === true || normalized.recurring === "true" || normalized.recurring === "yes",
            deduct_from_wallet: true // Default behavior for bulk
        };
    }).filter(i => i.amount > 0); // Filter out zero amount rows

    if (validItems.length === 0) {
        return NextResponse.json({ error: "No valid items found (amount > 0 required)" }, { status: 400 });
    }

    // Bulk insert
    const { data, error } = await supabase.from("costs").insert(validItems).select();

    if (error) {
        console.error("Bulk insert cost error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, count: data?.length || 0 });
}
