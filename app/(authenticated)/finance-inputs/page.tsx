"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const equityItems = [
  { id: 1, name: "Initial Investment", amount: "SAR 200,000", date: "2024-01-01" },
  { id: 2, name: "Partner Contribution", amount: "SAR 50,000", date: "2024-06-15" },
];
const capitalItems = [
  { id: 1, name: "Cash Reserve", amount: "SAR 45,000", date: "2025-01-01" },
  { id: 2, name: "Accounts Receivable", amount: "SAR 28,000", date: "2025-01-15" },
];
const assetItems = [
  { id: 1, name: "Office Equipment", amount: "SAR 15,000", date: "2024-03-01" },
  { id: 2, name: "Delivery Van", amount: "SAR 85,000", date: "2024-07-10" },
  { id: 3, name: "Inventory", amount: "SAR 120,000", date: "2025-01-01" },
];

function FinanceTable({ items, t, canEdit }: { items: { id: number; name: string; amount: string; date: string }[]; t: (k: string) => string; canEdit: boolean }) {
  const [addOpen, setAddOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          {canEdit && (
            <DialogTrigger asChild><Button size="sm" className="rounded-xl"><Plus className="w-4 h-4 me-1.5" />{t("action.add")}</Button></DialogTrigger>
          )}
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>{t("action.add")}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5"><Label>{t("label.name")}</Label><Input className="rounded-xl" /></div>
              <div className="grid gap-1.5"><Label>{t("label.amount")}</Label><Input type="number" className="rounded-xl" /></div>
              <div className="grid gap-1.5"><Label>{t("label.date")}</Label><Input type="date" className="rounded-xl" /></div>
              <Button onClick={() => setAddOpen(false)} className="rounded-xl">{t("action.save")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-card rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("label.name")}</TableHead>
                  <TableHead>{t("label.amount")}</TableHead>
                  <TableHead>{t("label.date")}</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell className="text-sm font-semibold">{item.name}</TableCell>
                    <TableCell className="text-sm font-semibold tabular-nums">{item.amount}</TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">{item.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="w-3.5 h-3.5" /></Button>
                        {canEdit && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function Finance() {
  const { t } = useLanguage();
  const { role } = useUser();
  const canEdit = role === 'owner' || role === 'admin' || role === 'editor';

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.finance")} subtitle="Equity, capital, and asset records" />
      <Tabs defaultValue="equity">
        <TabsList className="rounded-xl">
          <TabsTrigger value="equity" className="rounded-lg">{t("label.equity")}</TabsTrigger>
          <TabsTrigger value="capital" className="rounded-lg">{t("label.workingCapital")}</TabsTrigger>
          <TabsTrigger value="assets" className="rounded-lg">{t("label.assets")}</TabsTrigger>
        </TabsList>
        <TabsContent value="equity" className="mt-4"><FinanceTable items={equityItems} t={t} canEdit={canEdit} /></TabsContent>
        <TabsContent value="capital" className="mt-4"><FinanceTable items={capitalItems} t={t} canEdit={canEdit} /></TabsContent>
        <TabsContent value="assets" className="mt-4"><FinanceTable items={assetItems} t={t} canEdit={canEdit} /></TabsContent>
      </Tabs>
    </div>
  );
}
