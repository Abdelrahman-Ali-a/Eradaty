import { NextResponse } from "next/server";
import { supabaseServer, supabaseAdmin } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

export async function GET() {
    const supabase = await supabaseServer();
    const user = await requireUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const brandId = await requireBrandId(supabase, user.id);
    if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

    // Get members with permissions
    const { data: members, error } = await supabase
        .from("brand_members")
        .select("user_id, role, created_at, allowed_pages")
        .eq("brand_id", brandId);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Get owner
    const { data: brand } = await supabase
        .from("brands")
        .select("owner_user_id")
        .eq("id", brandId)
        .single();

    const ownerId = brand?.owner_user_id;
    const admin = supabaseAdmin();

    const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

    const usersMap = new Map(users.map(u => [u.id, u]));
    const memberList: any[] = [];

    // Add owner
    if (ownerId) {
        const u = usersMap.get(ownerId);
        if (u) {
            memberList.push({
                id: ownerId,
                email: u.email,
                role: 'owner',
                allowed_pages: null, // Owner has full access
                created_at: u.created_at,
                last_sign_in: u.last_sign_in_at,
                is_owner: true
            });
        }
    }

    members?.forEach((m: any) => {
        const u = usersMap.get(m.user_id);
        if (u) {
            memberList.push({
                id: m.user_id,
                email: u.email,
                role: m.role,
                allowed_pages: m.allowed_pages, // Include allowed_pages
                created_at: m.created_at,
                last_sign_in: u.last_sign_in_at,
                is_owner: false
            });
        }
    });

    return NextResponse.json({ members: memberList });
}

export async function POST(req: Request) {
    const supabase = await supabaseServer();
    const user = await requireUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const brandId = await requireBrandId(supabase, user.id);
    if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

    // Only owner or admin can invite 
    // And usually assign permissions
    const { data: brand } = await supabase.from("brands").select("owner_user_id").eq("id", brandId).single();
    const isOwner = brand?.owner_user_id === user.id;

    if (!isOwner) {
        const { data: member } = await supabase.from("brand_members").select("role").eq("user_id", user.id).single();
        if (member?.role !== 'admin') {
            return NextResponse.json({ error: "Only admins can invite users" }, { status: 403 });
        }
    }

    const body = await req.json();
    const { email, password, role, allowed_pages } = body;

    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    const admin = supabaseAdmin();

    // Create user
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { source: 'team_invite' }
    });

    // Check if user already exists
    if (createError) return NextResponse.json({ error: createError.message }, { status: 400 });
    if (!newUser.user) return NextResponse.json({ error: "Failed to create user" }, { status: 500 });

    // Add to brand_members with permissions
    const { error: inviteError } = await admin.from("brand_members").insert({
        brand_id: brandId,
        user_id: newUser.user.id,
        role: role || 'viewer',
        allowed_pages: allowed_pages || null
    });

    if (inviteError) {
        await admin.auth.admin.deleteUser(newUser.user.id);
        return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    return NextResponse.json({ user: newUser.user });
}
