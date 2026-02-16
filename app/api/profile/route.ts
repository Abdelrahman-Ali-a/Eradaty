import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

export async function GET() {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const { data: brand } = await supabase
    .from("brands")
    .select("id, name, logo_url, description, created_at")
    .eq("id", brandId)
    .single();

  return NextResponse.json({
    user: {
      email: user.email,
      full_name: user.user_metadata?.full_name || null,
      created_at: user.created_at,
    },
    brand: brand || null,
  });
}

export async function PATCH(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as any;

  const { error } = await supabase
    .from("brands")
    .update({
      name: body.name || undefined,
      description: body.description || undefined,
      logo_url: body.logo_url || undefined,
    })
    .eq("id", brandId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
