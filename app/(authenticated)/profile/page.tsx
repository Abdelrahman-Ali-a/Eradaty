"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi } from "@/hooks/useApi";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, User, Building2, Check, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface ProfileData {
  user: {
    email: string;
    full_name: string | null;
    created_at: string;
  };
  brand: {
    id: string;
    name: string;
    logo_url: string | null;
    description: string | null;
    created_at: string;
  } | null;
}

export default function Profile() {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refetch } = useApi<ProfileData>("/api/profile");

  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");

  // Update local state when data loads
  useState(() => {
    if (data) {
      setName(data.user.full_name || "");
      setBrandName(data.brand?.name || "");
      setBrandDescription(data.brand?.description || "");
    }
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: brandName,
          description: brandDescription,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      refetch();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("nav.profile")} subtitle="Manage your account and brand settings" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="shadow-card rounded-2xl">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("nav.profile")} subtitle="Manage your account and brand settings" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-4">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const userInitials = data?.user.full_name
    ? data.user.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : data?.user.email?.slice(0, 2).toUpperCase() || "??";

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.profile")} subtitle="Manage your account and brand settings" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-card rounded-2xl h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base font-bold">{t("label.userInfo")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow text-xl font-bold text-primary-foreground">
                  {userInitials}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{data?.user.full_name || "User"}</p>
                  <p className="text-[12px] text-muted-foreground">{data?.user.email}</p>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-sm font-medium">{t("label.name")}</Label>
                <Input value={data?.user.full_name || ""} className="rounded-xl" disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-sm font-medium">{t("label.email")}</Label>
                <Input value={data?.user.email || ""} type="email" className="rounded-xl" disabled />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-sm font-medium">Member Since</Label>
                <Input
                  value={new Date(data?.user.created_at || "").toLocaleDateString()}
                  className="rounded-xl"
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Brand Information */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-card rounded-2xl h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base font-bold">{t("label.brandInfo")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5">
                <Label className="text-sm font-medium">{t("label.logo")}</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all">
                    <Upload className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Upload your brand logo</p>
                    <p className="text-[11px] text-muted-foreground/60">PNG, SVG up to 2MB</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-sm font-medium">{t("label.brandName")}</Label>
                <Input
                  value={brandName || data?.brand?.name || ""}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-sm font-medium">Description</Label>
                <Input
                  value={brandDescription || data?.brand?.description || ""}
                  onChange={(e) => setBrandDescription(e.target.value)}
                  className="rounded-xl"
                  placeholder="Tell us about your brand"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-sm font-medium">Brand ID</Label>
                <Input value={data?.brand?.id || "N/A"} className="rounded-xl" disabled />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Save button */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-end"
      >
        <Button className="rounded-xl h-11 px-8 font-semibold" onClick={handleSave} disabled={saving}>
          {saved ? (
            <>
              <Check className="w-4 h-4 me-1.5" />
              Saved!
            </>
          ) : saving ? (
            "Saving..."
          ) : (
            t("action.save")
          )}
        </Button>
      </motion.div>
    </div>
  );
}
