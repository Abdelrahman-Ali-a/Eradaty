"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi } from "@/hooks/useApi";
import { KPICard } from "@/components/KPICard";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, Plus, Eye, Pencil, Trash2, Upload, AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";

interface ManualRevenue {
  id: string;
  date: string;
  amount: number;
  source: string;
  customer_name: string | null;
  description: string | null;
  photo_url: string | null;
}

interface ShopifyOrder {
  id: string;
  created_at: string;
  gross: number;
  net: number;
  customer_name: string | null;
}

interface RevenueData {
  manual: ManualRevenue[];
  shopify: ShopifyOrder[];
}

export default function Revenue() {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, loading, error, refetch } = useApi<RevenueData>("/api/revenues?include_shopify=true");

  const manualRevenues = data?.manual || [];
  const shopifyOrders = data?.shopify || [];

  const totalManual = manualRevenues.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalShopify = shopifyOrders.reduce((sum, o) => sum + Number(o.net), 0);
  const totalRevenue = totalManual + totalShopify;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Combine manual and shopify for display
  const allRevenues = [
    ...manualRevenues.map((r) => ({
      id: r.id,
      date: r.date,
      amount: formatCurrency(Number(r.amount)),
      source: r.source || "Manual",
      customer: r.customer_name || "-",
      desc: r.description || "-",
    })),
    ...shopifyOrders.map((o) => ({
      id: o.id,
      date: o.created_at.slice(0, 10),
      amount: formatCurrency(Number(o.net)),
      source: "Shopify",
      customer: o.customer_name || "-",
      desc: "Shopify Order",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () =>
    setSelected(selected.length === allRevenues.length ? [] : allRevenues.map((r) => r.id));

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("nav.revenue")} subtitle="Track and manage all revenue streams" />
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

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.revenue")} subtitle="Track and manage all revenue streams">
        {selected.length > 0 && (
          <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => setSelected([])}>
            <Trash2 className="w-4 h-4 me-1.5" />
            {t("action.bulkDelete")}
          </Button>
        )}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl">
              <Plus className="w-4 h-4 me-1.5" />
              {t("action.addRevenue")}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>{t("action.addRevenue")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label>{t("label.date")}</Label>
                <Input type="date" className="rounded-xl" />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("label.amount")}</Label>
                <Input type="number" placeholder="0.00" className="rounded-xl" />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("label.source")}</Label>
                <Input placeholder="Shopify / Manual" className="rounded-xl" />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("label.customer")}</Label>
                <Input className="rounded-xl" />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("label.description")}</Label>
                <Input className="rounded-xl" />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("label.photo")}</Label>
                <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Upload receipt or photo</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">PNG, JPG up to 5MB</p>
                </div>
              </div>
              <Button onClick={() => setModalOpen(false)} className="rounded-xl">
                {t("action.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="shadow-card rounded-2xl">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <KPICard
              title={`${t("label.total")} ${t("nav.revenue")}`}
              value={formatCurrency(totalRevenue)}
              icon={DollarSign}
              delay={0}
            />
            <KPICard
              title={`${t("label.manual")} ${t("nav.revenue")}`}
              value={formatCurrency(totalManual)}
              icon={DollarSign}
              delay={80}
            />
            <KPICard
              title={`${t("label.shopify")} ${t("nav.revenue")}`}
              value={formatCurrency(totalShopify)}
              icon={DollarSign}
              delay={160}
            />
          </>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="rounded-2xl shadow-card">
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : allRevenues.length === 0 ? (
        <Card className="rounded-2xl shadow-card">
          <CardContent className="p-12 text-center text-muted-foreground text-sm">
            No revenue found. Add your first revenue entry to get started.
          </CardContent>
        </Card>
      ) : isMobile ? (
        <div className="space-y-3">
          {allRevenues.map((row, i) => (
            <motion.div key={row.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="rounded-2xl shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{row.customer}</p>
                      <p className="text-[11px] text-muted-foreground">{row.desc}</p>
                    </div>
                    <p className="text-sm font-bold tabular-nums text-foreground">{row.amount}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {new Date(row.date).toLocaleDateString()}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {row.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-card rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={selected.length === allRevenues.length} onCheckedChange={toggleAll} />
                    </TableHead>
                    <TableHead>{t("label.date")}</TableHead>
                    <TableHead>{t("label.amount")}</TableHead>
                    <TableHead>{t("label.source")}</TableHead>
                    <TableHead>{t("label.customer")}</TableHead>
                    <TableHead>{t("label.description")}</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allRevenues.map((row) => (
                    <TableRow key={row.id} className="group">
                      <TableCell>
                        <Checkbox checked={selected.includes(row.id)} onCheckedChange={() => toggleSelect(row.id)} />
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {new Date(row.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm font-semibold tabular-nums">{row.amount}</TableCell>
                      <TableCell>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                          {row.source}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{row.customer}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.desc}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
