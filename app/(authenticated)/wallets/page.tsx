"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi } from "@/hooks/useApi";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, AlertCircle, ArrowRightLeft, Eye, Star, StarOff } from "lucide-react";
import { motion } from "framer-motion";

interface WalletData {
  id: string;
  name: string;
  type: string;
  currency: string;
  current_balance: number;
  monthly_budget: number | null;
  monthly_budget_used?: number;
  monthly_budget_remaining?: number;
  monthly_budget_percentage?: number;
  description: string | null;
  active: boolean;
  is_active: boolean; // Database has this field
  is_default: boolean; // Will be added via migration
  is_basic: boolean; // Database has this field (same as is_default)
}

interface WalletsResponse {
  wallets: WalletData[];
}

export default function Wallets() {
  const { t } = useLanguage();
  const [addOpen, setAddOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [viewWalletId, setViewWalletId] = useState<string | null>(null);
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDesc, setTransferDesc] = useState("");

  const { data, loading, error, refetch } = useApi<WalletsResponse>("/api/wallets");

  const wallets = data?.wallets || [];
  const viewWallet = wallets.find((w) => w.id === viewWalletId);

  const formatCurrency = (amount: number, currency: string = "EGP") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleTransfer = async () => {
    if (!fromWalletId || !toWalletId || !transferAmount) return;

    try {
      const res = await fetch("/api/wallet-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_wallet_id: fromWalletId,
          to_wallet_id: toWalletId,
          amount: Number(transferAmount),
          description: transferDesc,
          transfer_date: new Date().toISOString().slice(0, 10),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Transfer failed");
        return;
      }

      setTransferOpen(false);
      setFromWalletId("");
      setToWalletId("");
      setTransferAmount("");
      setTransferDesc("");
      refetch();
    } catch (err) {
      alert("Transfer failed");
    }
  };

  const handleSetDefault = async (walletId: string) => {
    try {
      const res = await fetch(`/api/wallets/${walletId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: true }),
      });

      if (!res.ok) {
        alert("Failed to set default wallet");
        return;
      }

      refetch();
    } catch (err) {
      alert("Failed to set default wallet");
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("nav.wallets")} subtitle="Manage your financial accounts" />
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
      <PageHeader title={t("nav.wallets")} subtitle="Manage your financial accounts">
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setTransferOpen(true)}>
          <ArrowRightLeft className="w-4 h-4 me-1.5" />
          {t("action.transfer")}
        </Button>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl">
              <Plus className="w-4 h-4 me-1.5" />
              {t("action.addWallet")}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>{t("action.addWallet")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label>{t("label.name")}</Label>
                <Input className="rounded-xl" />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("label.balance")}</Label>
                <Input type="number" placeholder="0.00" className="rounded-xl" />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("label.budget")}</Label>
                <Input type="number" placeholder="0.00" className="rounded-xl" />
              </div>
              <Button onClick={() => setAddOpen(false)} className="rounded-xl">
                {t("action.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Transfer Between Wallets</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>From Wallet</Label>
              <Select value={fromWalletId} onValueChange={setFromWalletId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select source wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} - {formatCurrency(Number(w.current_balance), w.currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>To Wallet</Label>
              <Select value={toWalletId} onValueChange={setToWalletId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select destination wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets
                    .filter((w) => w.id !== fromWalletId)
                    .map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} - {formatCurrency(Number(w.current_balance), w.currency)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                className="rounded-xl"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Description (Optional)</Label>
              <Input
                className="rounded-xl"
                placeholder="Transfer note..."
                value={transferDesc}
                onChange={(e) => setTransferDesc(e.target.value)}
              />
            </div>
            <Button onClick={handleTransfer} className="rounded-xl" disabled={!fromWalletId || !toWalletId || !transferAmount}>
              Transfer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Wallet Dialog */}
      <Dialog open={!!viewWalletId} onOpenChange={(open) => !open && setViewWalletId(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Wallet Details</DialogTitle>
          </DialogHeader>
          {viewWallet && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Name</p>
                  <p className="text-lg font-bold">{viewWallet.name}</p>
                </div>
                {viewWallet.is_default && (
                  <Badge variant="default" className="gap-1">
                    <Star className="w-3 h-3" />
                    Default
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(Number(viewWallet.current_balance), viewWallet.currency)}</p>
              </div>
              {viewWallet.monthly_budget && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Monthly Budget Usage</p>
                  <Progress value={((viewWallet.monthly_budget_used || 0) / viewWallet.monthly_budget) * 100} className="h-2 mb-1" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(viewWallet.monthly_budget_used || 0, viewWallet.currency)} used</span>
                    <span>{formatCurrency(viewWallet.monthly_budget, viewWallet.currency)} budget</span>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="text-sm font-medium capitalize">{viewWallet.type}</p>
              </div>
              {viewWallet.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{viewWallet.description}</p>
                </div>
              )}
              {!viewWallet.is_default && (
                <Button onClick={() => handleSetDefault(viewWallet.id)} variant="outline" className="w-full rounded-xl">
                  <Star className="w-4 h-4 me-2" />
                  Set as Default Wallet
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="shadow-card rounded-2xl">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-4" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <Card className="shadow-card rounded-2xl">
          <CardContent className="p-12 text-center text-muted-foreground text-sm">
            No wallets found. Add your first wallet to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {wallets.map((w, i) => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="shadow-card hover:shadow-card-hover transition-all duration-300 rounded-2xl group cursor-pointer" onClick={() => setViewWalletId(w.id)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-muted-foreground">{w.name}</p>
                        {w.is_default && (
                          <Badge variant="default" className="h-5 px-1.5 text-[10px] gap-0.5">
                            <Star className="w-2.5 h-2.5" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-2xl font-bold tabular-nums text-foreground tracking-tight">
                        {formatCurrency(Number(w.current_balance), w.currency)}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/12 transition-colors">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  {w.monthly_budget && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>{t("label.budget")} usage</span>
                        <span className="tabular-nums font-semibold">
                          {Math.round(((w.monthly_budget_used || 0) / w.monthly_budget) * 100)}%
                        </span>
                      </div>
                      <Progress value={((w.monthly_budget_used || 0) / w.monthly_budget) * 100} className="h-2 rounded-full" />
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg" onClick={(e) => { e.stopPropagation(); setViewWalletId(w.id); }}>
                      <Eye className="w-3 h-3 me-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
