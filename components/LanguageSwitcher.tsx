"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Languages } from "lucide-react";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "ar" : "en")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      aria-label={t("language")}
      title={language === "en" ? t("arabic") : t("english")}
    >
      <Languages className="h-5 w-5" />
    </button>
  );
}
