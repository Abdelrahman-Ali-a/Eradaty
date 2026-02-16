"use client";

import { Bell, Sun, Moon, Globe, Search } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const isMobile = useIsMobile();

  return (
    <header className="h-14 border-b border-border bg-card/80 glass-surface flex items-center justify-between px-4 md:px-6 gap-2 shrink-0 sticky top-0 z-40">
      {/* Left spacer for mobile menu button */}
      <div className={isMobile ? "w-10" : "w-0"} />

      {/* Right actions */}
      <div className="flex items-center gap-1 ms-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage(language === "en" ? "ar" : "en")}
          className="gap-1.5 text-muted-foreground hover:text-foreground rounded-xl h-9"
        >
          <Globe className="w-4 h-4" />
          <span className="text-xs font-medium hidden sm:inline">{language === "en" ? "العربية" : "English"}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground rounded-xl h-9 w-9"
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground rounded-xl h-9 w-9"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-card" />
        </Button>
      </div>
    </header>
  );
}
