import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId } from "@/lib/brand";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import AppShellClient from "./AppShellClient";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY);
  const supabase = hasSupabase ? await supabaseServer() : null;
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  
  let brandData = null;
  if (user && supabase) {
    const brandId = await requireBrandId(supabase, user.id).catch(() => null);
    if (brandId) {
      const { data } = await supabase
        .from("brands")
        .select("name, logo_url")
        .eq("id", brandId)
        .single();
      brandData = data;
    }
  }
  
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  // If not authenticated, show simple layout
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2">
              <img src="/eradaty-logo.svg" alt="Eradaty" className="h-8 w-8" />
              <span className="text-lg font-semibold tracking-tight">Eradaty</span>
            </Link>
            <nav className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
              <Link 
                className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground" 
                href="/login"
              >
                Sign in
              </Link>
              <Link 
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90" 
                href="/signup"
              >
                Sign up
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-12">{children}</main>
      </div>
    );
  }

  // Authenticated layout with sidebar and header
  return <AppShellClient userName={userName} brandData={brandData}>{children}</AppShellClient>;
}
