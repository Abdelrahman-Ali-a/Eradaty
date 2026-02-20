"use client";

import Link from "next/link";
import { LayoutDashboard, TrendingDown, TrendingUp, Users, Landmark, Wallet, Plug, User, LogOut } from "lucide-react";
import NotificationsDropdown from "./NotificationsDropdown";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";

type BrandData = {
  name: string;
  logo_url: string | null;
};

type AppShellClientProps = {
  userName: string;
  brandData: BrandData | null;
  children: React.ReactNode;
};

export default function AppShellClient({ userName, brandData: initialBrandData, children }: AppShellClientProps) {
  const { t, direction } = useLanguage();
  const [brandData, setBrandData] = useState(initialBrandData);

  // Listen for logo update events and refresh immediately
  useEffect(() => {
    const handleLogoUpdate = async () => {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.brand) {
          setBrandData(data.brand);
        }
      }
    };

    window.addEventListener("brandLogoUpdated", handleLogoUpdate);
    return () => window.removeEventListener("brandLogoUpdated", handleLogoUpdate);
  }, []);

  return (
    <div className="flex min-h-screen bg-background" dir={direction}>
      {/* Sidebar */}
      <aside className={`fixed ${direction === "rtl" ? "right-0" : "left-0"} top-0 z-40 h-screen w-64 border-${direction === "rtl" ? "l" : "r"} border-border bg-card`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b border-border px-6">
            <img src="/eradaty-logo.svg" alt="Eradaty" className="h-8 w-8" />
            <span className="text-lg font-semibold tracking-tight">Eradaty</span>
          </div>

          {/* Profile Section */}
          <div className="border-b border-border p-4">
            <Link href="/profile" className="block rounded-lg p-3 transition-colors hover:bg-accent">
              <div className="flex items-center gap-3">
                {brandData?.logo_url ? (
                  <img src={brandData.logo_url} alt="Brand" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <User className="h-6 w-6" />
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs text-muted-foreground">{t("welcomeBack")}</p>
                  <p className="truncate font-semibold">{userName}</p>
                  {brandData?.name && (
                    <p className="truncate text-xs text-muted-foreground">{brandData.name}</p>
                  )}
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            <Link
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              href="/dashboard"
            >
              <LayoutDashboard className="h-5 w-5" />
              {t("dashboard")}
            </Link>
            <Link
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              href="/revenue"
            >
              <TrendingUp className="h-5 w-5" />
              {t("revenue")}
            </Link>
            <Link
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              href="/costs"
            >
              <TrendingDown className="h-5 w-5" />
              {t("costs")}
            </Link>
            <Link
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              href="/wallets"
            >
              <Wallet className="h-5 w-5" />
              {t("wallets")}
            </Link>
            <Link
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              href="/salaries"
            >
              <Users className="h-5 w-5" />
              {t("salaries")}
            </Link>
            <Link
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              href="/finance-inputs"
            >
              <Landmark className="h-5 w-5" />
              {t("finance")}
            </Link>
            <Link
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              href="/integrations"
            >
              <Plug className="h-5 w-5" />
              {t("integrations")}
            </Link>
          </nav>

          {/* Bottom Actions */}
          <div className="border-t border-border p-4">
            <form action="/api/auth/signout" method="post">
              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                <LogOut className="h-5 w-5" />
                {t("signOut")}
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`${direction === "rtl" ? "mr-64" : "ml-64"} flex-1`}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-end gap-2 px-6">
            <LanguageSwitcher />
            <ThemeToggle />
            <NotificationsDropdown />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
