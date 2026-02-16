import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

export async function GET() {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ brand: null });

  const { data, error } = await supabase.from("brands").select("*").eq("id", brandId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ brand: data });
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await requireBrandId(supabase, user.id);
  if (existing) return NextResponse.json({ error: "Brand already exists" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as { name?: string; currency?: string; timezone?: string } | null;
  if (!body?.name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const { data, error } = await supabase
    .from("brands")
    .insert({
      owner_user_id: user.id,
      name: body.name,
      currency: body.currency ?? "EGP",
      timezone: body.timezone ?? "Africa/Cairo"
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ brandId: data.id });
}
