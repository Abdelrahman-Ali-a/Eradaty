import { SupabaseClient } from "@supabase/supabase-js";

export async function requireUser(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

import { supabaseAdmin } from "@/lib/supabaseServer";

export async function requireBrandId(supabase: SupabaseClient, userId: string) {
  // Use admin client to bypass strict RLS on brands table during discovery
  const admin = supabaseAdmin();

  // 1. Get owned brands
  const { data: owned } = await admin
    .from("brands")
    .select("id, created_at")
    .eq("owner_user_id", userId);

  // 2. Get member brands
  const { data: memberships } = await admin
    .from("brand_members")
    .select("brand_id, brands!inner(created_at)")
    .eq("user_id", userId);

  // 3. Normalize list
  const allBrands: { id: string, created_at: string }[] = [
    ...(owned || []).map(b => ({ id: b.id, created_at: b.created_at })),
    ...(memberships || []).map(m => ({
      id: m.brand_id,
      created_at: (m.brands as any)?.created_at // Handle potential join structure
    }))
  ];

  if (allBrands.length === 0) return null;

  // 4. Sort by created_at ASC (Oldest first)
  allBrands.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // 5. Return the oldest (likely the established brand)
  return allBrands[0].id;
}
