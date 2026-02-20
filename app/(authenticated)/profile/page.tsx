"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi } from "@/hooks/useApi";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, User, Building2, Check, AlertCircle, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { TeamManagement } from "@/components/TeamManagement";

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
}

export default function Profile() {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refetch } = useApi<ProfileData>("/api/profile");

  const [userName, setUserName] = useState("");
  const [userAvatarFile, setUserAvatarFile] = useState<File | null>(null);
  const [userAvatarPreview, setUserAvatarPreview] = useState<string | null>(null);

  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [brandLogoPreview, setBrandLogoPreview] = useState<string | null>(null);

  // Update local state when data loads
  useEffect(() => {
    if (data) {
      setUserName(data.user.full_name || "");
      setUserAvatarPreview(data.user.avatar_url || null);

      setBrandName(data.brand?.name || "");
      setBrandDescription(data.brand?.description || "");
      setBrandLogoPreview(data.brand?.logo_url || null);
    }
  }, [data]);

  const handleUserAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }
      setUserAvatarFile(file);
      setUserAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBrandLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }
      setBrandLogoFile(file);
      setBrandLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = supabaseBrowser();

      // 1. Upload User Avatar (if changed)
      let userAvatarUrl = data?.user.avatar_url;
      if (userAvatarFile && data?.user.email) {
        const fileExt = userAvatarFile.name.split('.').pop();
        // Use a simple, sanitized filename
        const sanitizedEmail = data.user.email.replace(/[^a-zA-Z0-9]/g, '');
        const filePath = `${sanitizedEmail}_avatar_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, userAvatarFile, { upsert: true });

        if (uploadError) throw new Error("Avatar upload failed: " + uploadError.message);

        const { data: publicData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        userAvatarUrl = publicData.publicUrl;
      }

      // 2. Upload Brand Logo (if changed)
      let brandLogoUrl = data?.brand?.logo_url;
      if (brandLogoFile && data?.brand?.id) {
        const fileExt = brandLogoFile.name.split('.').pop();
        const filePath = `${data.brand.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('brands')
          .upload(filePath, brandLogoFile, { upsert: true });

        if (uploadError) throw new Error("Brand logo upload failed: " + uploadError.message);

        const { data: publicUrlData } = supabase.storage
          .from('brands')
          .getPublicUrl(filePath);

        brandLogoUrl = publicUrlData.publicUrl;
      }

      // 3. Update Profile via API
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: userName,
          user_avatar_url: userAvatarUrl,
          name: brandName,
          description: brandDescription,
          logo_url: brandLogoUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to save profile");

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      refetch();
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save profile");
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

  const userInitials = (userName || data?.user.email || "??")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
                <div className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all overflow-hidden group">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={handleUserAvatarChange}
                  />
                  {userAvatarPreview ? (
                    <img src={userAvatarPreview} alt="User Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                      {userInitials}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{userName || "User"}</p>
                  <p className="text-[12px] text-muted-foreground">{data?.user.email}</p>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-sm font-medium">{t("label.name")}</Label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="rounded-xl"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-sm font-medium">{t("label.email")}</Label>
                <Input value={data?.user.email || ""} type="email" className="rounded-xl" disabled />
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
                  <div className="relative w-16 h-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all overflow-hidden group">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={handleBrandLogoChange}
                    />
                    {brandLogoPreview ? (
                      <img src={brandLogoPreview} alt="Brand Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                    )}
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
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-sm font-medium">Description</Label>
                <Input
                  value={brandDescription}
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

      {/* Team Management */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <TeamManagement />
      </motion.div>

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
