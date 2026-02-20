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
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, Plus, Eye, Pencil, Trash2, AlertCircle, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { OCRResult, InvoiceLineItem } from "@/lib/ocrService";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/DateRangeFilter";
import { BulkUpload } from "@/components/BulkUpload";
import { ExportButtons } from "@/components/ExportButtons";

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
    source: 'Manual',
    customer: '',
    description: '',
  });
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [ocrConfidence, setOcrConfidence] = useState<any>(null);
  const [userEdited, setUserEdited] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const queryParams = new URLSearchParams();
  queryParams.set("include_shopify", "true");
  if (dateRange?.from) queryParams.set("startDate", dateRange.from.toISOString());
  if (dateRange?.to) queryParams.set("endDate", dateRange.to.toISOString());

  const { data, loading, error, refetch } = useApi<RevenueData>(`/api/revenues?${queryParams.toString()}`);

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
    if (!userEdited.has('source') && fields.source) {
      newFormData.source = fields.source;
    }
    if (!userEdited.has('customer') && fields.customer) {
      newFormData.customer = fields.customer;
    }
    if (!userEdited.has('description') && fields.description) {
      newFormData.description = fields.description;
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
  const handleFieldChange = (field: string, value: string) => {
    if (viewOnly) return;
    setFormData({ ...formData, [field]: value });
    setUserEdited(new Set(userEdited).add(field));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      source: 'Manual',
      customer: '',
      description: '',
    });
    setLineItems([]);
    setOcrConfidence(null);
    setUserEdited(new Set());
    setEditingId(null);
    setViewOnly(false);
  };

  // Load revenue data
  const loadRevenueData = async (row: any) => {
    setEditingId(row.id);
    setModalOpen(true);

    // Set initial data from row
    setFormData({
      date: row.date,
      amount: row.amount.replace(/[^0-9.-]+/g, ""), // simple number extraction
      source: row.source,
      customer: row.customer === '-' ? '' : row.customer,
      description: row.desc === '-' ? '' : row.desc,
    });

    // Fetch full details (line items)
    try {
      const response = await fetch(`/api/revenues/${row.id}`);
      if (response.ok) {
        const fullData = await response.json();
        // Set raw amount to handle currency formatting removal correctly
        setFormData(prev => ({
          ...prev,
          amount: fullData.amount?.toString() || '',
          description: fullData.description || '',
          customer: fullData.customer_name || ''
        }));

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
      console.error("Failed to fetch revenue details", error);
    }
  };

  // Handle edit
  const handleEdit = (row: any) => {
    if (row.source === 'Shopify') {
      toast.info("Cannot edit Shopify orders directly.");
      return;
    }
    setViewOnly(false);
    loadRevenueData(row);
  };

  // Handle view
  const handleView = (row: any) => {
    if (row.source === 'Shopify') {
      // Ideally fetch Shopify details, but for now just show basic row info in readonly
      setFormData({
        date: row.date,
        amount: row.amount.replace(/[^0-9.-]+/g, ""),
        source: row.source,
        customer: row.customer,
        description: row.desc,
      });
      setViewOnly(true);
      setModalOpen(true);
      return;
    }
    setViewOnly(true);
    loadRevenueData(row);
  };

  // Handle delete
  const handleDelete = async (row: any) => {
    if (!canEdit) {
      toast.error("You do not have permission to delete revenue.");
      return;
    }

    if (row.source === 'Shopify') {
      toast.info("Cannot delete Shopify orders.");
      return;
    }

    if (!confirm(t("confirm.delete"))) return;

    try {
      const response = await fetch(`/api/revenues/${row.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete revenue");
      }

      toast.success("Revenue deleted successfully");
      refetch();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete revenue");
    }
  };

  // Handle save
  const handleSave = async () => {
    if (viewOnly) {
      setModalOpen(false);
      return;
    }

    if (!canEdit) {
      toast.error("You do not have permission to add/edit revenue.");
      return;
    }

    try {
      // Validate required fields
      if (!formData.date || !formData.amount || !formData.source) {
        toast.error("Please fill in all required fields");
        return;
      }

      const payload = {
        date: formData.date,
        amount: parseFloat(formData.amount),
        source: formData.source,
        customer: formData.customer || null,
        description: formData.description || null,
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

      console.log('Saving revenue:', payload);

      const url = editingId ? `/api/revenues/${editingId}` : '/api/revenues';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save revenue');
      }

      toast.success(editingId ? "Revenue updated successfully!" : "Revenue saved successfully!");
      setModalOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || "Failed to save revenue");
    }
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
        <div className="flex items-center gap-2 mr-2">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          {canEdit && <BulkUpload type="revenue" onUploadSuccess={refetch} />}
          <ExportButtons
            data={allRevenues}
            filename={`revenue-${new Date().toISOString().slice(0, 10)}`}
            columns={[
              { key: 'date', header: 'Date', formatter: (val: any) => new Date(val).toLocaleDateString("en-GB") },
              { key: 'amount', header: 'Amount' },
              { key: 'source', header: 'Source' },
              { key: 'customer', header: 'Customer' },
              { key: 'desc', header: 'Description' }
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
                {t("action.addRevenue")}
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {viewOnly ? "View Revenue" : editingId ? "Edit Revenue" : t("action.addRevenue")}
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
                  context="revenue"
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
                <Label>{t("label.source")}</Label>
                <Input
                  value={formData.source}
                  onChange={(e) => handleFieldChange('source', e.target.value)}
                  placeholder="Shopify / Manual"
                  className="rounded-xl"
                  disabled={viewOnly}
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="flex items-center gap-2">
                  {t("label.customer")}
                  {ocrConfidence && ocrConfidence.vendor_or_customer < 0.7 && ocrConfidence.vendor_or_customer > 0 && (
                    <Badge variant="outline" className="text-xs">Low confidence</Badge>
                  )}
                </Label>
                <Input
                  value={formData.customer}
                  onChange={(e) => handleFieldChange('customer', e.target.value)}
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
                {viewOnly ? "Close" : editingId ? "Update Revenue" : t("action.save")}
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
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleView(row)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(row)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(row)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
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
                      <Checkbox checked={selected.length === allRevenues.length} onCheckedChange={toggleAll} disabled={!canEdit} />
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
                        <Checkbox checked={selected.includes(row.id)} onCheckedChange={() => toggleSelect(row.id)} disabled={!canEdit} />
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
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleView(row)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {canEdit && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(row)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(row)}>
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
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
