import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";
import { metaAuthUrl } from "@/lib/meta";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.redirect(new URL("/onboarding", req.url));

  const state = crypto.randomBytes(16).toString("hex");
  const res = NextResponse.redirect(
    metaAuthUrl({
      appId: process.env.META_APP_ID!,
      redirectUri: process.env.META_REDIRECT_URI!,
      state
    })
  );

  res.cookies.set("meta_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
