"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, ShoppingBag, ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { key: "brand", icon: Building2 },
  { key: "store", icon: ShoppingBag },
  { key: "done", icon: Check },
];

export default function Onboarding() {
  const { t } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i <= step ? "gradient-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground"
              }`}>
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-0.5 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[480px]"
      >
        {step === 0 && (
          <Card className="shadow-premium rounded-2xl border">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4">
                  <Image
                    src="/logo.jpg"
                    alt="Eradaty Logo"
                    width={160}
                    height={44}
                    className="w-full h-auto object-contain"
                  />
                </div>
                <h2 className="text-xl font-bold text-foreground">{t("label.welcome")}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("label.onboardingDesc")}</p>
              </div>
              <div className="space-y-4">
                <div className="grid gap-1.5"><Label>{t("label.brandName")}</Label><Input placeholder="Your brand name" className="rounded-xl h-11" /></div>
                <div className="grid gap-1.5"><Label>{t("label.phone")}</Label><Input placeholder="+966 50 000 0000" className="rounded-xl h-11" /></div>
                <Button className="w-full rounded-xl h-11 font-semibold" onClick={() => setStep(1)}>
                  Continue <ArrowRight className="w-4 h-4 ms-1.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card className="shadow-premium rounded-2xl border">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
                  <ShoppingBag className="w-7 h-7 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Connect your store</h2>
                <p className="text-sm text-muted-foreground mt-1">Link your Shopify store to auto-sync revenue</p>
              </div>
              <div className="space-y-4">
                <div className="grid gap-1.5"><Label>Store URL</Label><Input placeholder="your-store.myshopify.com" className="rounded-xl h-11" /></div>
                <div className="grid gap-1.5"><Label>API Key</Label><Input className="rounded-xl h-11" /></div>
                <Button className="w-full rounded-xl h-11 font-semibold" onClick={() => setStep(2)}>
                  Continue <ArrowRight className="w-4 h-4 ms-1.5" />
                </Button>
                <Button variant="ghost" className="w-full rounded-xl" onClick={() => setStep(2)}>
                  Skip for now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="shadow-premium rounded-2xl border">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">You're all set!</h2>
              <p className="text-sm text-muted-foreground mb-6">Your account is ready. Start managing your ecommerce finances with Eradaty.</p>
              <Button className="rounded-xl h-11 px-8 font-semibold" onClick={() => router.push("/dashboard")}>
                {t("action.getStarted")} <ArrowRight className="w-4 h-4 ms-1.5" />
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
