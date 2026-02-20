"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useApi } from "@/hooks/useApi";
import { EradatyLogo } from "@/components/EradatyLogo";
import { navItems } from "@/lib/nav"; // Imported from shared config
import { Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ProfileData {
  user: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
  };
  brand: {
    id: string;
    name: string;
    logo_url: string | null;
    description: string | null;
    created_at: string;
  } | null;
  role?: string;
  allowed_pages?: string[] | null;
}

function SidebarContent({ onNavigate, profileData }: { onNavigate?: () => void; profileData?: ProfileData | null }) {
  const { t } = useLanguage();
  const pathname = usePathname();

  const userInitials = profileData?.user.full_name
    ? profileData.user.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : profileData?.user.email?.slice(0, 2).toUpperCase() || "??";

  const userName = profileData?.user.full_name || profileData?.user.email || "User";
  const userAvatar = profileData?.user.avatar_url;
  const brandName = profileData?.brand?.name || "Brand";

  // Filter navigation items based on permissions
  const allowed = profileData?.allowed_pages;
  const userRole = profileData?.role || 'viewer';

  const filteredNavItems = navItems.filter(item => {
    // Owner and Admin have full access
    if (userRole === 'owner' || userRole === 'admin') return true;

    // Check specific permissions if defined
    // If allowed is null/undefined, default to full access (backward compatibility)
    // If allowed is array, check if path is included
    if (!allowed) return true;

    return allowed.includes(item.path);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center px-4 py-4">
        <EradatyLogo className="w-48 max-w-full h-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {t("label.menu")}
        </p>
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname?.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-xl bg-sidebar-accent"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <item.icon className={cn("w-[18px] h-[18px] shrink-0 relative z-10 transition-colors", isActive && "text-primary")} />
              <span className="relative z-10">{t(item.key)}</span>
              {item.key === "nav.notifications" && (
                <span className="relative z-10 ms-auto w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  3
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile block */}
      <div className="border-t border-sidebar-border px-4 py-4 space-y-3">
        <Link
          href="/profile"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 px-2 py-2 rounded-xl transition-colors hover:bg-accent/60",
            pathname === "/profile" && "bg-sidebar-accent"
          )}
        >
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center shadow-sm overflow-hidden shrink-0">
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary-foreground font-semibold text-xs">{userInitials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{brandName}</p>
          </div>
        </Link>

        <form action="/api/auth/signout" method="post">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
            type="submit"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">{t("signOut")}</span>
          </Button>
        </form>
      </div>
    </div >
  );
}

export function AppSidebar() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const { data: profileData } = useApi<ProfileData>("/api/profile");

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-3 start-3 z-50 md:hidden bg-card shadow-card border border-border">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0 border-e border-sidebar-border bg-sidebar">
          <SidebarContent onNavigate={() => setOpen(false)} profileData={profileData} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="hidden md:flex flex-col h-screen w-[260px] border-e border-sidebar-border bg-sidebar shrink-0 sticky top-0">
      <SidebarContent profileData={profileData} />
    </aside>
  );
}
