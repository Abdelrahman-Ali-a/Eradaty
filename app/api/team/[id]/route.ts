import { NextResponse } from "next/server";
import { supabaseServer, supabaseAdmin } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await supabaseServer();
    const user = await requireUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const brandId = await requireBrandId(supabase, user.id);
    if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

    const targetUserId = params.id;
    if (!targetUserId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    // Permissions check: Owner or Admin
    const { data: brand } = await supabase.from("brands").select("owner_user_id").eq("id", brandId).single();
    const isOwner = brand?.owner_user_id === user.id;

    if (!isOwner) {
        const { data: member } = await supabase.from("brand_members").select("role").eq("user_id", user.id).single();
        if (member?.role !== 'admin') {
            return NextResponse.json({ error: "Only admins or owners can manage members" }, { status: 403 });
        }
    }

    const body = await req.json();
    const { role, allowed_pages } = body;

    const admin = supabaseAdmin();

    // Update member
    const updates: any = {};
    if (role) updates.role = role;
    if (allowed_pages !== undefined) updates.allowed_pages = allowed_pages;

    const { error: updateError } = await admin
        .from("brand_members")
        .update(updates)
        .eq("user_id", targetUserId)
        .eq("brand_id", brandId);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await supabaseServer();
    const user = await requireUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const brandId = await requireBrandId(supabase, user.id);
    if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

    const targetUserId = params.id;
    if (!targetUserId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    const { data: brand } = await supabase.from("brands").select("owner_user_id").eq("id", brandId).single();
    const isOwner = brand?.owner_user_id === user.id;

    if (!isOwner) {
        return NextResponse.json({ error: "Only owners can remove users" }, { status: 403 });
    }

    const admin = supabaseAdmin();

    await admin.from("brand_members").delete().eq("user_id", targetUserId).eq("brand_id", brandId);
    await admin.auth.admin.signOut(targetUserId);
    const { error: deleteError } = await admin.auth.admin.deleteUser(targetUserId);

    if (deleteError) {
        console.error("Failed to delete user:", deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
}
