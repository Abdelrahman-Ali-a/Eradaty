import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

export async function GET() {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  // Don't error immediately if brand not found, we still want to return user profile
  // But sidebar relies on brand, so we might return null brand

  let brand = null;
  let role = "viewer";

  if (brandId) {
    const { data } = await supabase
      .from("brands")
      .select("id, name, logo_url, description, created_at, owner_user_id")
      .eq("id", brandId)
      .single();
    brand = data;

    if (brand?.owner_user_id === user.id) {
      role = "owner";
    } else {
      const { data: member } = await supabase
        .from("brand_members")
        .select("role, allowed_pages")
        .eq("user_id", user.id)
        .eq("brand_id", brandId)
        .maybeSingle();
      if (member) {
        role = member.role;
        // If allowed_pages is null, it means full access (default behavior)? or no access?
        // We handle this logic in frontend/context usually. 
        // Let's pass it through.
        // However, if logic is: Admin = All, Owner = All.
        // Viewer = Check allowed_pages.
        // We can normalize here or just pass raw data.
        // Passing raw data is more flexible.
      }
    }
  }

  // Get allowed_pages from member data if available
  let allowed_pages = null;
  if (role !== 'owner' && brandId) {
    const { data: member } = await supabase
      .from("brand_members")
      .select("allowed_pages")
      .eq("user_id", user.id)
      .eq("brand_id", brandId)
      .maybeSingle();
    if (member) allowed_pages = member.allowed_pages;
  }

  return NextResponse.json({
    user: {
      email: user.email,
      full_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      created_at: user.created_at,
    },
    brand: brand || null,
    role,
    allowed_pages // Added to response
  });
}

export async function PATCH(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as any;

  // 1. Update User Profile (Metadata)
  if (body.full_name !== undefined || body.user_avatar_url !== undefined) {
    const updates: any = {};
    if (body.full_name !== undefined) updates.full_name = body.full_name;
    if (body.user_avatar_url !== undefined) updates.avatar_url = body.user_avatar_url;

    // Only call updateUser if there are updates
    if (Object.keys(updates).length > 0) {
      const { error: userError } = await supabase.auth.updateUser({
        data: updates
      });
      if (userError) return NextResponse.json({ error: "Failed to update profile: " + userError.message }, { status: 400 });
    }
  }

  // 2. Update Brand Information
  const brandId = await requireBrandId(supabase, user.id);
  if (brandId && (body.name !== undefined || body.description !== undefined || body.logo_url !== undefined)) {
    const { error: brandError } = await supabase
      .from("brands")
      .update({
        name: body.name !== undefined ? body.name : undefined,
        description: body.description !== undefined ? body.description : undefined,
        logo_url: body.logo_url !== undefined ? body.logo_url : undefined,
      })
      .eq("id", brandId);

    if (brandError) return NextResponse.json({ error: brandError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
