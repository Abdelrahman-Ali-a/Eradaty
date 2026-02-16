"use client";


import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { ShoppingBag, BarChart3, RefreshCw, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function Integrations() {
  const { t } = useLanguage();
  const [shopifyModal, setShopifyModal] = useState(false);

  const integrations = [
    {
      name: "Shopify",
      icon: ShoppingBag,
      connected: true,
      lastSynced: "2 hours ago",
      desc: "Sync orders, products, and revenue automatically from your Shopify store.",
    },
    {
      name: "Meta Ads",
      icon: BarChart3,
      connected: false,
      lastSynced: null,
      desc: "Track ad spend and campaign performance across Meta platforms.",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.integrations")} subtitle="Connect your tools and platforms" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {integrations.map((intg, i) => (
          <motion.div key={intg.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="shadow-card hover:shadow-card-hover transition-all duration-300 rounded-2xl group h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/12 transition-colors">
                      <intg.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{intg.name}</h3>
                      <StatusBadge status={intg.connected ? "connected" : "disconnected"} label={intg.connected ? t("label.connected") : t("label.disconnected")} />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4 flex-1">{intg.desc}</p>
                {intg.lastSynced && (
                  <p className="text-[11px] text-muted-foreground mb-4">{t("label.lastSynced")}: {intg.lastSynced}</p>
                )}
                {intg.connected ? (
                  <Button variant="outline" size="sm" className="w-full rounded-xl"><RefreshCw className="w-3.5 h-3.5 me-1.5" />{t("action.sync")}</Button>
                ) : (
                  <Button size="sm" className="w-full rounded-xl" onClick={() => intg.name === "Shopify" ? setShopifyModal(true) : undefined}>
                    <ExternalLink className="w-3.5 h-3.5 me-1.5" />{t("action.connect")}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={shopifyModal} onOpenChange={setShopifyModal}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Connect Shopify</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5"><Label>Store URL</Label><Input placeholder="your-store.myshopify.com" className="rounded-xl" /></div>
            <div className="grid gap-1.5"><Label>API Key</Label><Input className="rounded-xl" /></div>
            <div className="grid gap-1.5"><Label>API Secret</Label><Input type="password" className="rounded-xl" /></div>
            <Button onClick={() => setShopifyModal(false)} className="rounded-xl">{t("action.connect")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
