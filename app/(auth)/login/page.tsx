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
import { Globe, Moon, Sun } from "lucide-react";
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

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook' | 'azure') => {
    setLoading(true);
    setError(null);
    try {
      const supabase = supabaseBrowser();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || "Social login failed");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = supabaseBrowser();

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

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with Language/Theme Toggles */}
      <header className="flex justify-end items-center p-4 gap-2 absolute top-0 right-0 z-50 w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage(language === "en" ? "ar" : "en")}
          className="gap-2"
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs uppercase font-medium">{language === "en" ? "العربية" : "English"}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 rounded-full"
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-[400px] border-border shadow-lg animate-in fade-in zoom-in-95 duration-300">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              {/* Logo matching dashboard sidebar size/style */}
              <EradatyLogo className="w-48 max-w-full h-auto" />
            </div>
            <CardTitle className="text-2xl font-bold">{t("action.login")}</CardTitle>
            <CardDescription>
              {t("label.loginDesc") || "Enter your email below to login to your account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("label.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("label.password")}</Label>
                  {/* Using standard anchor tag for robust navigation to forgot password page */}
                  <a
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 relative z-50 cursor-pointer"
                  >
                    {t("label.forgotPassword") || "Forgot password?"}
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium mt-2"
                disabled={loading}
              >
                {loading ? (t("label.loading") || "Signing in...") : t("action.login")}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-medium">
                  {t("label.orContinueWith")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="h-11 rounded-xl gap-2 font-medium"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.01.68-2.31 1.09-3.71 1.09-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.13c-.22-.66-.35-1.36-.35-2.13s.13-1.47.35-2.13V7.03H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.97l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.03l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {t("label.google")}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('apple')}
                disabled={loading}
                className="h-11 rounded-xl gap-2 font-medium"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.05 20.28c-.98.95-2.05 1.72-3.21 1.72-1.13 0-1.52-.69-2.86-.69-1.33 0-1.8.69-2.86.69-1.13 0-2.34-.86-3.32-1.72-2-2.02-3.52-5.71-3.52-8.57 0-4.54 2.8-6.93 5.46-6.93 1.34 0 2.45.85 3.23.85.77 0 2.08-.94 3.55-.94 1.54 0 2.89.78 3.7 1.87-3.12 1.88-2.6 6.32.55 8.16-.9 2.52-2.01 4.54-3.72 5.47zM11.96 4.67c-.24-1.74 1.25-3.41 2.92-3.61.27 2.02-1.85 3.8-2.92 3.61z" />
                </svg>
                {t("label.apple")}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('facebook')}
                disabled={loading}
                className="h-11 rounded-xl gap-2 font-medium"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.03 4.41 11.02 10.12 11.91v-8.41H7.08v-3.5h3.04V9.41c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.68.23 2.68.23v2.96h-1.5c-1.49 0-1.96.92-1.96 1.87v2.26h3.32l-.53 3.5h-2.79v8.41C19.59 23.09 24 18.1 24 12.07z" />
                </svg>
                {t("label.facebook")}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('azure')}
                disabled={loading}
                className="h-11 rounded-xl gap-2 font-medium"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1h10v10H1z" fill="#f25022" />
                  <path d="M13 1h10v10H13z" fill="#7dbb00" />
                  <path d="M1 13h10v10H1z" fill="#00a1f1" />
                  <path d="M13 13h10v10H13z" fill="#ffbb00" />
                </svg>
                {t("label.microsoft")}
              </Button>
            </div>

            <div className="text-center text-sm pt-2">
              <span className="text-muted-foreground">
                {t("label.noAccount") || "Don't have an account?"}{" "}
              </span>
              <a href="/signup" className="font-semibold text-primary hover:underline">
                {t("action.signup")}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
