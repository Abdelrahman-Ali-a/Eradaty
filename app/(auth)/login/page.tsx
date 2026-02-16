"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { EradatyLogo } from "@/components/EradatyLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Globe, Moon, Sun, AlertCircle } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = supabaseBrowser();

      // Sign in the user
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Failed to log in. Please try again.");
        setLoading(false);
        return;
      }

      // Successfully logged in, redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top nav */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800">
            <EradatyLogo className="h-7 w-auto" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setLanguage(language === "en" ? "ar" : "en")} className="rounded-xl">
            <Globe className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl h-9 w-9">
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
          <Link href="/signup">
            <Button variant="outline" size="sm" className="rounded-xl">{t("action.signup")}</Button>
          </Link>
        </div>
      </header>

      {/* Auth card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-[420px] shadow-premium rounded-2xl border animate-scale-in">
          <CardHeader className="text-center space-y-3 pb-2">
            <div className="w-32 h-20 mx-auto mb-2 flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800">
              <EradatyLogo className="w-full h-auto" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{t("action.login")}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                {t("label.loginDesc")}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("label.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("label.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="rounded-xl"
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                disabled={loading}
              >
                {loading ? t("label.loading") || "Loading..." : t("action.login")}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              {t("label.noAccount")} <Link href="/signup" className="text-primary hover:underline font-medium">{t("action.signup")}</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
