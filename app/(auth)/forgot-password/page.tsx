"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { EradatyLogo } from "@/components/EradatyLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Globe, Moon, Sun } from "lucide-react";

export default function ForgotPassword() {
    const { t, language, setLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const supabase = supabaseBrowser();
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/api/auth/callback?next=/update-password`,
            });

            if (error) {
                setError(error.message);
            } else {
                setSent(true);
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
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
                        <CardTitle className="text-2xl font-bold">{t("label.resetPassword") || "Reset Password"}</CardTitle>
                        <CardDescription>
                            Enter your email address to receive a password reset link.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {sent ? (
                            <div className="text-center space-y-4">
                                <div className="flex justify-center">
                                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                                </div>
                                <p className="text-muted-foreground">
                                    If an account exists for <strong>{email}</strong>, we have sent a password reset link. Check your inbox (and spam folder).
                                </p>
                                <div className="pt-2">
                                    <Link href="/login">
                                        <Button variant="outline" className="w-full h-11">Return to Login</Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
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
                                <Button
                                    type="submit"
                                    className="w-full h-11 text-base font-medium mt-2"
                                    disabled={loading}
                                >
                                    {loading ? (t("label.loading") || "Sending...") : (t("label.sendResetLink") || "Send Reset Link")}
                                </Button>
                                <div className="text-center pt-2">
                                    <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
                                        {t("label.backToLogin") || "Back to Login"}
                                    </Link>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
