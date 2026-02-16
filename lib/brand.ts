import { SupabaseClient } from "@supabase/supabase-js";

export async function requireUser(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function requireBrandId(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("brands")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}
