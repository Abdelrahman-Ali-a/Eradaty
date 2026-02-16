"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi } from "@/hooks/useApi";
import { KPICard } from "@/components/KPICard";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/StatusBadge";
import { Receipt, Plus, Eye, Pencil, Trash2, Check, X, AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";

interface Cost {
  id: string;
  date: string;
  amount: number;
  category: string;
  vendor: string | null;
  note: string | null;
  recurring: string | null;
}

interface CostsData {
  costs: Cost[];
}

export default function Costs() {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, loading, error, refetch } = useApi<CostsData>("/api/costs");

  const costsData = data?.costs || [];
  const totalCosts = costsData.reduce((sum, cost) => sum + Number(cost.amount), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const toggleSelect = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleAll = () =>
    setSelected(selected.length === costsData.length ? [] : costsData.map((c) => c.id));

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("nav.costs")} subtitle="Manage and approve your expenses" />
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
      <PageHeader title={t("nav.costs")} subtitle="Manage and approve your expenses">
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
              {t("action.addCost")}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>{t("action.addCost")}</DialogTitle>
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
                <Label>{t("label.category")}</Label>
                <Input placeholder="Marketing, Shipping..." className="rounded-xl" />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("label.vendor")}</Label>
                <Input className="rounded-xl" />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("label.description")}</Label>
                <Input className="rounded-xl" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="recurring" />
                <Label htmlFor="recurring">{t("label.recurring")}</Label>
              </div>
              <Button onClick={() => setModalOpen(false)} className="rounded-xl">
                {t("action.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <Card className="shadow-card rounded-2xl">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ) : (
          <KPICard
            title={t("kpi.totalCosts")}
            value={formatCurrency(totalCosts)}
            icon={Receipt}
            trend=""
            trendUp={false}
          />
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="shadow-card rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : costsData.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                No costs found. Add your first cost to get started.
              </div>
            ) : isMobile ? (
              <div className="divide-y divide-border">
                {costsData.map((row) => (
                  <div key={row.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">{row.vendor || row.category}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {row.category} · {new Date(row.date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm font-bold tabular-nums">{formatCurrency(Number(row.amount))}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      {row.recurring ? (
                        <StatusBadge status="active" label="Recurring" />
                      ) : (
                        <span className="text-[11px] text-muted-foreground">One-time</span>
                      )}
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
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={selected.length === costsData.length} onCheckedChange={toggleAll} />
                    </TableHead>
                    <TableHead>{t("label.date")}</TableHead>
                    <TableHead>{t("label.category")}</TableHead>
                    <TableHead>{t("label.vendor")}</TableHead>
                    <TableHead>{t("label.amount")}</TableHead>
                    <TableHead>{t("label.recurring")}</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costsData.map((row) => (
                    <TableRow key={row.id} className="group">
                      <TableCell>
                        <Checkbox checked={selected.includes(row.id)} onCheckedChange={() => toggleSelect(row.id)} />
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {new Date(row.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">{row.category}</TableCell>
                      <TableCell className="text-sm">{row.vendor || "-"}</TableCell>
                      <TableCell className="text-sm font-semibold tabular-nums">
                        {formatCurrency(Number(row.amount))}
                      </TableCell>
                      <TableCell>
                        {row.recurring ? (
                          <StatusBadge status="active" label="Yes" />
                        ) : (
                          <span className="text-sm text-muted-foreground">No</span>
                        )}
                      </TableCell>
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
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
