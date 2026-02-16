import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Skip middleware for static assets and public files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !anon) {
    if (pathname !== "/") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  const res = NextResponse.next();

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
        cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: any }) => {
          res.cookies.set(name, value, options);
        });
      }
    }
  });

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  // Allow access to auth pages
  if (pathname === "/login" || pathname === "/signup" || pathname === "/onboarding") {
    return res;
  }

  // Redirect to login if not authenticated
  if (!user) {
    const u = new URL("/login", req.url);
    return NextResponse.redirect(u);
  }

  // Check if user has completed onboarding (has a brand)
  if (pathname !== "/onboarding") {
    const { data: brand } = await supabase
      .from("brands")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (!brand?.id) {
      const u = new URL("/onboarding", req.url);
      return NextResponse.redirect(u);
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
