"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import { useApi } from "@/hooks/useApi";
import { KPICard } from "@/components/KPICard";
import { PageHeader } from "@/components/PageHeader";
import { InvoiceUpload } from "@/components/InvoiceUpload";
import { LineItemsEditor } from "@/components/LineItemsEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/StatusBadge";
import { Receipt, Plus, Eye, Pencil, Trash2, Check, X, AlertCircle, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { OCRResult, InvoiceLineItem } from "@/lib/ocrService";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/DateRangeFilter";
import { BulkUpload } from "@/components/BulkUpload";
import { ExportButtons } from "@/components/ExportButtons";

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
  const { role } = useUser();
  const canEdit = role === 'owner' || role === 'admin' || role === 'editor';

  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewOnly, setViewOnly] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    vendor: '',
    description: '',
    recurring: false,
  });
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [ocrConfidence, setOcrConfidence] = useState<any>(null);
  const [userEdited, setUserEdited] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const queryParams = new URLSearchParams();
  if (dateRange?.from) queryParams.set("startDate", dateRange.from.toISOString());
  if (dateRange?.to) queryParams.set("endDate", dateRange.to.toISOString());

  const { data, loading, error, refetch } = useApi<CostsData>(`/api/costs?${queryParams.toString()}`);

  const costsData = data?.costs || [];
  const totalCosts = costsData.reduce((sum, cost) => sum + Number(cost.amount), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Handle OCR completion
  const handleOCRComplete = (result: OCRResult) => {
    if (viewOnly) return;
    const fields = result.fields;

    // Only auto-fill fields that user hasn't edited
    const newFormData = { ...formData };
    if (!userEdited.has('date') && fields.date) {
      newFormData.date = fields.date;
    }
    if (!userEdited.has('amount') && fields.amount) {
      newFormData.amount = fields.amount.toString();
    }
    if (!userEdited.has('category') && fields.category) {
      newFormData.category = fields.category;
    }
    if (!userEdited.has('vendor') && fields.vendor) {
      newFormData.vendor = fields.vendor;
    }
    if (!userEdited.has('description') && fields.description) {
      newFormData.description = fields.description;
    }
    if (!userEdited.has('recurring') && fields.recurring !== undefined) {
      newFormData.recurring = fields.recurring;
    }

    setFormData(newFormData);
    setLineItems(result.items || []);
    setOcrConfidence(result.confidence);

    if (result.confidence.overall >= 0.7) {
      toast.success("Invoice data extracted successfully!");
    } else if (result.confidence.overall >= 0.4) {
      toast.warning("Partial data extracted. Please review the form.");
    }
  };

  // Handle field change
  const handleFieldChange = (field: string, value: string | boolean) => {
    if (viewOnly) return;
    setFormData({ ...formData, [field]: value });
    setUserEdited(new Set(userEdited).add(field));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: '',
      vendor: '',
      description: '',
      recurring: false,
    });
    setLineItems([]);
    setOcrConfidence(null);
    setUserEdited(new Set());
    setEditingId(null);
    setViewOnly(false);
  };

  // Load cost data
  const loadCostData = async (cost: Cost) => {
    setEditingId(cost.id);
    setModalOpen(true);

    // Set initial data from row
    setFormData({
      date: cost.date.split('T')[0],
      amount: cost.amount.toString(),
      category: cost.category,
      vendor: cost.vendor || '',
      description: cost.note || '',
      recurring: !!cost.recurring,
    });

    // Fetch full details (line items)
    try {
      const response = await fetch(`/api/costs/${cost.id}`);
      if (response.ok) {
        const fullData = await response.json();
        if (fullData.line_items) {
          setLineItems(fullData.line_items.map((item: any) => ({
            name: item.item_name,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_total: item.line_total,
            sku: item.sku,
            tax: item.tax_amount
          })));
        }
      }
    } catch (error) {
      console.error("Failed to fetch cost details", error);
    }
  };

  // Handle edit
  const handleEdit = (cost: Cost) => {
    setViewOnly(false);
    loadCostData(cost);
  };

  // Handle view
  const handleView = (cost: Cost) => {
    setViewOnly(true);
    loadCostData(cost);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!canEdit) {
      toast.error("You do not have permission to delete costs.");
      return;
    }

    if (!confirm(t("confirm.delete"))) return;

    try {
      const response = await fetch(`/api/costs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete cost");
      }

      toast.success("Cost deleted successfully");
      refetch();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete cost");
    }
  };

  // Handle save
  const handleSave = async () => {
    if (viewOnly) {
      setModalOpen(false);
      return;
    }

    if (!canEdit) {
      toast.error("You do not have permission to edit costs.");
      return;
    }

    try {
      // Validate required fields
      if (!formData.date || !formData.amount || !formData.category) {
        toast.error("Please fill in all required fields");
        return;
      }

      const payload = {
        date: formData.date,
        amount: parseFloat(formData.amount),
        category: formData.category,
        vendor: formData.vendor || null,
        description: formData.description || null,
        recurring: formData.recurring ? 'monthly' : null, // Default to monthly if true
        // OCR data
        ocr_confidence: ocrConfidence?.overall ?? null,
        ocr_data: ocrConfidence ? { confidence: ocrConfidence } : null,
        invoice_currency: lineItems.length > 0 ? 'USD' : null,
        invoice_total: lineItems.length > 0
          ? lineItems.reduce((sum, item) => sum + item.line_total, 0)
          : null,
        // Line items
        line_items: lineItems.length > 0 ? lineItems : null,
      };

      console.log('Saving/Updating cost:', payload);

      const url = editingId ? `/api/costs/${editingId}` : '/api/costs';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save cost');
      }

      toast.success(editingId ? "Cost updated successfully!" : "Cost saved successfully!");
      setModalOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || "Failed to save cost");
    }
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
        <div className="flex items-center gap-2 mr-2">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          {canEdit && <BulkUpload type="cost" onUploadSuccess={refetch} />}
          <ExportButtons
            data={costsData}
            filename={`costs-${new Date().toISOString().slice(0, 10)}`}
            columns={[
              { key: 'date', header: 'Date', formatter: (val: any) => new Date(val).toLocaleDateString("en-GB") },
              { key: 'amount', header: 'Amount', formatter: (val: any) => formatCurrency(Number(val)) },
              { key: 'category', header: 'Category' },
              { key: 'vendor', header: 'Vendor' },
              { key: 'note', header: 'Description' }
            ]}
          />
        </div>
        {canEdit && selected.length > 0 && (
          <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => setSelected([])}>
            <Trash2 className="w-4 h-4 me-1.5" />
            {t("action.bulkDelete")}
          </Button>
        )}
        <Dialog open={modalOpen} onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) resetForm();
        }}>
          {canEdit && (
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl">
                <Plus className="w-4 h-4 me-1.5" />
                {t("action.addCost")}
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {viewOnly ? "View Cost" : editingId ? "Edit Cost" : t("action.addCost")}
                {ocrConfidence && ocrConfidence.overall >= 0.7 && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Extracted
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              {/* Invoice Upload - Hide in view mode */}
              {!viewOnly && (
                <InvoiceUpload
                  context="cost"
                  onOCRComplete={handleOCRComplete}
                />
              )}

              {/* Form Fields */}
              <div className="grid gap-1.5">
                <Label className="flex items-center gap-2">
                  {t("label.date")}
                  {ocrConfidence && ocrConfidence.date < 0.7 && ocrConfidence.date > 0 && (
                    <Badge variant="outline" className="text-xs">Low confidence</Badge>
                  )}
                </Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                  className="rounded-xl"
                  disabled={viewOnly}
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="flex items-center gap-2">
                  {t("label.amount")}
                  {ocrConfidence && ocrConfidence.amount < 0.7 && ocrConfidence.amount > 0 && (
                    <Badge variant="outline" className="text-xs">Low confidence</Badge>
                  )}
                </Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleFieldChange('amount', e.target.value)}
                  placeholder="0.00"
                  className="rounded-xl"
                  disabled={viewOnly}
                />
              </div>

              <div className="grid gap-1.5">
                <Label>{t("label.category")}</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  placeholder="Marketing, Shipping..."
                  className="rounded-xl"
                  disabled={viewOnly}
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="flex items-center gap-2">
                  {t("label.vendor")}
                  {ocrConfidence && ocrConfidence.vendor_or_customer < 0.7 && ocrConfidence.vendor_or_customer > 0 && (
                    <Badge variant="outline" className="text-xs">Low confidence</Badge>
                  )}
                </Label>
                <Input
                  value={formData.vendor}
                  onChange={(e) => handleFieldChange('vendor', e.target.value)}
                  className="rounded-xl"
                  disabled={viewOnly}
                />
              </div>

              <div className="grid gap-1.5">
                <Label>{t("label.description")}</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="rounded-xl"
                  disabled={viewOnly}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="recurring"
                  checked={formData.recurring}
                  onCheckedChange={(checked) => handleFieldChange('recurring', checked as boolean)}
                  disabled={viewOnly}
                />
                <Label htmlFor="recurring">{t("label.recurring")}</Label>
              </div>

              {/* Line Items Editor */}
              {(lineItems.length > 0 || !viewOnly) && (
                <LineItemsEditor
                  items={lineItems}
                  onChange={setLineItems}
                  currency="EGP"
                  readonly={viewOnly}
                />
              )}

              <Button onClick={handleSave} className="rounded-xl" disabled={viewOnly}>
                {viewOnly ? "Close" : editingId ? "Update Cost" : t("action.save")}
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
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleView(row)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {canEdit && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(row)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(row.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
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
                      <Checkbox checked={selected.length === costsData.length} onCheckedChange={toggleAll} disabled={!canEdit} />
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
                        <Checkbox checked={selected.includes(row.id)} onCheckedChange={() => toggleSelect(row.id)} disabled={!canEdit} />
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
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleView(row)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {canEdit && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(row)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(row.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
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
