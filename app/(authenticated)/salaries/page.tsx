"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi } from "@/hooks/useApi";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Plus, Eye, Pencil, Trash2, AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";

interface Employee {
  id: string;
  name: string;
  position: string | null;
  monthly_salary: number;
  start_date: string;
  end_date: string | null;
  active: boolean;
  auto_payment: boolean;
}

interface SalaryPayment {
  id: string;
  employee_id: string;
  amount: number;
  payment_date: string;
  period_month: string;
  period_year: number;
  note: string | null;
}

interface EmployeesResponse {
  employees: Employee[];
}

interface SalaryPaymentsResponse {
  payments: SalaryPayment[];
}

export default function Salaries() {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [selectedEmp, setSelectedEmp] = useState<string[]>([]);
  const [selectedPay, setSelectedPay] = useState<string[]>([]);
  const [addEmpOpen, setAddEmpOpen] = useState(false);
  const [addPayOpen, setAddPayOpen] = useState(false);

  const { data: empData, loading: empLoading, error: empError } = useApi<EmployeesResponse>("/api/employees");
  const { data: payData, loading: payLoading, error: payError } = useApi<SalaryPaymentsResponse>("/api/salary-payments");

  const employees = empData?.employees || [];
  const payments = payData?.payments || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    return emp?.name || "Unknown";
  };

  if (empError || payError) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("nav.salaries")} subtitle="Employee payroll management" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{empError || payError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.salaries")} subtitle="Employee payroll management" />

      <Tabs defaultValue="employees">
        <TabsList className="rounded-xl">
          <TabsTrigger value="employees" className="rounded-lg">
            {t("label.employees")}
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg">
            {t("label.payments")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4 mt-4">
          <div className="flex items-center justify-end gap-2">
            {selectedEmp.length > 0 && (
              <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => setSelectedEmp([])}>
                <Trash2 className="w-4 h-4 me-1.5" />
                {t("action.bulkDelete")}
              </Button>
            )}
            <Dialog open={addEmpOpen} onOpenChange={setAddEmpOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-xl">
                  <Plus className="w-4 h-4 me-1.5" />
                  {t("action.add")} {t("label.employee")}
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {t("action.add")} {t("label.employee")}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-1.5">
                    <Label>{t("label.name")}</Label>
                    <Input className="rounded-xl" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{t("label.role")}</Label>
                    <Input className="rounded-xl" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{t("label.salary")}</Label>
                    <Input type="number" className="rounded-xl" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{t("label.startDate")}</Label>
                    <Input type="date" className="rounded-xl" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="autoPay" />
                    <Label htmlFor="autoPay">{t("label.autoPayment")}</Label>
                  </div>
                  <Button onClick={() => setAddEmpOpen(false)} className="rounded-xl">
                    {t("action.save")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-card rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                {empLoading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : employees.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground text-sm">
                    No employees found. Add your first employee to get started.
                  </div>
                ) : isMobile ? (
                  <div className="divide-y divide-border">
                    {employees.map((e) => (
                      <div key={e.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold">{e.name}</p>
                            <p className="text-[11px] text-muted-foreground">{e.position || "No position"}</p>
                          </div>
                          <div className="text-end">
                            <p className="text-sm font-bold tabular-nums">{formatCurrency(Number(e.monthly_salary))}</p>
                            {e.auto_payment ? (
                              <StatusBadge status="auto" label="Auto" />
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Manual</span>
                            )}
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
                          <Checkbox
                            checked={selectedEmp.length === employees.length}
                            onCheckedChange={() =>
                              setSelectedEmp(selectedEmp.length === employees.length ? [] : employees.map((e) => e.id))
                            }
                          />
                        </TableHead>
                        <TableHead>{t("label.name")}</TableHead>
                        <TableHead>{t("label.role")}</TableHead>
                        <TableHead>{t("label.salary")}</TableHead>
                        <TableHead>{t("label.startDate")}</TableHead>
                        <TableHead>{t("label.autoPayment")}</TableHead>
                        <TableHead className="w-24"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((e) => (
                        <TableRow key={e.id} className="group">
                          <TableCell>
                            <Checkbox
                              checked={selectedEmp.includes(e.id)}
                              onCheckedChange={() =>
                                setSelectedEmp((p) => (p.includes(e.id) ? p.filter((x) => x !== e.id) : [...p, e.id]))
                              }
                            />
                          </TableCell>
                          <TableCell className="text-sm font-semibold">{e.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{e.position || "-"}</TableCell>
                          <TableCell className="text-sm font-semibold tabular-nums">{formatCurrency(Number(e.monthly_salary))}</TableCell>
                          <TableCell className="text-sm tabular-nums">{new Date(e.start_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {e.auto_payment ? (
                              <StatusBadge status="auto" label="Auto" />
                            ) : (
                              <span className="text-sm text-muted-foreground">Manual</span>
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
        </TabsContent>

        <TabsContent value="payments" className="space-y-4 mt-4">
          <div className="flex items-center justify-end gap-2">
            {selectedPay.length > 0 && (
              <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => setSelectedPay([])}>
                <Trash2 className="w-4 h-4 me-1.5" />
                {t("action.bulkDelete")}
              </Button>
            )}
            <Dialog open={addPayOpen} onOpenChange={setAddPayOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-xl">
                  <Plus className="w-4 h-4 me-1.5" />
                  {t("action.add")} {t("label.payments")}
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {t("action.add")} {t("label.payments")}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-1.5">
                    <Label>{t("label.employee")}</Label>
                    <Input className="rounded-xl" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{t("label.amount")}</Label>
                    <Input type="number" className="rounded-xl" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{t("label.period")}</Label>
                    <Input placeholder="Jan 2025" className="rounded-xl" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{t("label.date")}</Label>
                    <Input type="date" className="rounded-xl" />
                  </div>
                  <Button onClick={() => setAddPayOpen(false)} className="rounded-xl">
                    {t("action.save")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-card rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                {payLoading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground text-sm">No salary payments found.</div>
                ) : isMobile ? (
                  <div className="divide-y divide-border">
                    {payments.map((p) => (
                      <div key={p.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{getEmployeeName(p.employee_id)}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {p.period_month} {p.period_year} · {new Date(p.payment_date).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm font-bold tabular-nums">{formatCurrency(Number(p.amount))}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={selectedPay.length === payments.length}
                            onCheckedChange={() => setSelectedPay(selectedPay.length === payments.length ? [] : payments.map((p) => p.id))}
                          />
                        </TableHead>
                        <TableHead>{t("label.employee")}</TableHead>
                        <TableHead>{t("label.amount")}</TableHead>
                        <TableHead>{t("label.period")}</TableHead>
                        <TableHead>{t("label.date")}</TableHead>
                        <TableHead className="w-24"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id} className="group">
                          <TableCell>
                            <Checkbox
                              checked={selectedPay.includes(p.id)}
                              onCheckedChange={() =>
                                setSelectedPay((prev) => (prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]))
                              }
                            />
                          </TableCell>
                          <TableCell className="text-sm font-medium">{getEmployeeName(p.employee_id)}</TableCell>
                          <TableCell className="text-sm font-semibold tabular-nums">{formatCurrency(Number(p.amount))}</TableCell>
                          <TableCell className="text-sm">
                            {p.period_month} {p.period_year}
                          </TableCell>
                          <TableCell className="text-sm tabular-nums">{new Date(p.payment_date).toLocaleDateString()}</TableCell>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
