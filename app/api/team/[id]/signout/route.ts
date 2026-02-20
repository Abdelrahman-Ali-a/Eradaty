import { NextResponse } from "next/server";
import { supabaseServer, supabaseAdmin } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await supabaseServer();
    const user = await requireUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const brandId = await requireBrandId(supabase, user.id);
    if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

    const targetUserId = params.id;
    if (!targetUserId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    // Only owner can terminate sessions
    const { data: brand } = await supabase
        .from("brands")
        .select("owner_user_id")
        .eq("id", brandId)
        .single();

    if (brand?.owner_user_id !== user.id) {
        return NextResponse.json({ error: "Only the owner can terminate sessions" }, { status: 403 });
    }

    // Prevent owner from terminating their own session
    if (targetUserId === user.id) {
        return NextResponse.json({ error: "Cannot terminate your own session" }, { status: 400 });
    }

    // Verify membership
    const { data: membership } = await supabaseAdmin()
        .from("brand_members")
        .select("user_id")
        .eq("user_id", targetUserId)
        .eq("brand_id", brandId)
        .maybeSingle();

    if (!membership) {
        return NextResponse.json({ error: "User is not a member of this brand" }, { status: 404 });
    }

    // ROBUST TERMINATION:
    // 1. Set a termination timestamp in app_metadata
    // 2. This will be checked in middleware to force-invalidate existing cookies
    const { error } = await supabaseAdmin().auth.admin.updateUserById(targetUserId, {
        app_metadata: {
            last_terminated_at: Date.now()
        }
    });

    if (error) {
        console.error("[signout] error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Still try to call the standard signOut as a secondary measure
    await supabaseAdmin().auth.admin.signOut(targetUserId, "global").catch(() => { });

    return NextResponse.json({ ok: true, message: "Session terminated successfully" });
}
