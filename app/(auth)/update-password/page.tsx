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
import { useRouter } from "next/navigation";

export default function UpdatePassword() {
    const router = useRouter();
    const { t, language, setLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [updated, setUpdated] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        setError(null);
        setLoading(true);

        try {
            const supabase = supabaseBrowser();
            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                setError(error.message);
            } else {
                setUpdated(true);
                setTimeout(() => {
                    router.push("/dashboard");
                }, 3000);
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
                        <CardTitle className="text-2xl font-bold">{t("label.resetPassword") || "Set New Password"}</CardTitle>
                        <CardDescription>
                            Please enter your new password below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {updated ? (
                            <div className="text-center space-y-4 py-4">
                                <div className="flex justify-center">
                                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                                </div>
                                <p className="text-lg font-medium">Password Updated!</p>
                                <p className="text-muted-foreground">
                                    Your password has been changed successfully. Redirecting to dashboard...
                                </p>
                                <Button onClick={() => router.push('/dashboard')} className="w-full mt-4 h-11">
                                    Go to Dashboard
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                                    {loading ? "Updating..." : "Update Password"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
