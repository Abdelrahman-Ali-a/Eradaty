"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { EradatyLogo } from "@/components/EradatyLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Globe, Moon, Sun, AlertCircle, X, Loader2, Phone } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

function SignupContent() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [iframeUrl, setIframeUrl] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Check for error from Akedly callback redirect
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "phone_verification_failed") {
      setError(t("label.verificationFailed"));
    }
  }, [searchParams, t]);

  // Listen for postMessage from Akedly iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://auth.akedly.io") return;

      if (event.data.type === "AUTH_SUCCESS") {
        console.log("Akedly OTP verification successful!", event.data);
        setShowOtpModal(false);
        router.push("/onboarding");
      } else if (event.data.type === "AUTH_FAILED") {
        setShowOtpModal(false);
        setError(t("label.verificationFailed"));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router, t]);

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

  const startPhoneVerification = async () => {
    setOtpLoading(true);
    setError(null);
    try {
      // Format phone number to E.164 if it doesn't start with +
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+20" + formattedPhone; // Default to Egypt country code
      }

      const response = await fetch("/api/auth/akedly/create-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          email: email,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to start phone verification");
      }

      setIframeUrl(data.iframeUrl);
      setShowOtpModal(true);
    } catch (err: any) {
      setError(err.message || "Failed to start phone verification");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = supabaseBrowser();

      // Format phone number
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+20" + formattedPhone;
      }

      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            phone: formattedPhone,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      // Account created successfully — now verify phone via Akedly
      await startPhoneVerification();
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
          <Link href="/login">
            <Button variant="outline" size="sm" className="rounded-xl">{t("action.login")}</Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-[420px] shadow-premium rounded-2xl border animate-scale-in">
          <CardHeader className="text-center space-y-3 pb-2">
            <div className="w-32 h-20 mx-auto mb-2 flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800">
              <EradatyLogo className="w-full h-auto" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{t("action.signup")}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                {t("label.signupDesc")}
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
                <Label htmlFor="name">{t("label.name")}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t("label.yourName")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  className="rounded-xl"
                />
              </div>
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
                  minLength={6}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("label.phoneNumber")}</Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 rounded-xl border bg-muted text-sm text-muted-foreground min-w-[60px] justify-center">
                    +20
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t("label.phonePlaceholder")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    required
                    disabled={loading}
                    className="rounded-xl flex-1"
                    maxLength={15}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                disabled={loading || otpLoading}
              >
                {loading || otpLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("label.loading") || "Loading..."}
                  </span>
                ) : (
                  t("action.signup")
                )}
              </Button>
            </form>

            <div className="relative my-4">
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
                className="rounded-xl h-11 gap-2 font-medium"
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
                className="rounded-xl h-11 gap-2 font-medium"
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
                className="rounded-xl h-11 gap-2 font-medium"
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
                className="rounded-xl h-11 gap-2 font-medium"
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
            <p className="text-center text-sm text-muted-foreground">
              {t("label.haveAccount")} <Link href="/login" className="text-primary hover:underline font-medium">{t("action.login")}</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Akedly OTP Verification Modal */}
      {showOtpModal && iframeUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowOtpModal(false);
          }}
        >
          <div className="relative w-full max-w-[500px] h-[700px] mx-4 animate-in zoom-in-95 duration-300">
            {/* Close button */}
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute -top-3 -right-3 z-10 bg-background border border-border rounded-full p-1.5 shadow-lg hover:bg-muted transition-colors"
              aria-label={t("label.closeModal")}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-2">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t("label.otpVerification")}</h3>
                  <p className="text-sm text-blue-100">{t("label.otpDescription")}</p>
                </div>
              </div>
            </div>

            {/* Iframe */}
            <iframe
              src={iframeUrl}
              className="w-full border-none bg-white rounded-b-2xl"
              style={{ height: "calc(100% - 76px)" }}
              allow="clipboard-write"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={null}>
      <SignupContent />
    </Suspense>
  );
}
