"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { InvoiceLineItem } from "@/lib/ocrService";

interface LineItemsEditorProps {
    items: InvoiceLineItem[];
    onChange: (items: InvoiceLineItem[]) => void;
    currency?: string;
    readonly?: boolean;
}

export function LineItemsEditor({ items, onChange, currency = 'EGP', readonly = false }: LineItemsEditorProps) {
    const [isOpen, setIsOpen] = useState(items.length > 0);

    const addItem = () => {
        onChange([
            ...items,
            {
                name: '',
                quantity: 1,
                unit_price: 0,
                line_total: 0,
            },
        ]);
    };

    const removeItem = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-calculate line_total if quantity or unit_price changes
        if (field === 'quantity' || field === 'unit_price') {
            const qty = field === 'quantity' ? parseFloat(value) || 0 : newItems[index].quantity;
            const price = field === 'unit_price' ? parseFloat(value) || 0 : newItems[index].unit_price;
            newItems[index].line_total = qty * price;
        }

        onChange(newItems);
    };

    const totalAmount = items.reduce((sum, item) => sum + item.line_total, 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        }).format(amount);
    };

    if (items.length === 0 && readonly) {
        return null;
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card className="rounded-2xl shadow-card">
                <CardHeader className="pb-3">
                    <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-base">Invoice Line Items</CardTitle>
                                {items.length > 0 && (
                                    <Badge variant="secondary" className="rounded-full">
                                        {items.length} {items.length === 1 ? 'item' : 'items'}
                                    </Badge>
                                )}
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                        </div>
                    </CollapsibleTrigger>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                        {items.length > 0 ? (
                            <div className="border rounded-xl overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40%]">Item</TableHead>
                                            <TableHead className="w-[15%]">Qty</TableHead>
                                            <TableHead className="w-[20%]">Unit Price</TableHead>
                                            <TableHead className="w-[20%]">Total</TableHead>
                                            {!readonly && <TableHead className="w-[5%]"></TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {readonly ? (
                                                        <div>
                                                            <p className="text-sm font-medium">{item.name}</p>
                                                            {item.description && (
                                                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                                            )}
                                                            {item.sku && (
                                                                <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            <Input
                                                                value={item.name}
                                                                onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                                placeholder="Item name"
                                                                className="h-8 text-sm"
                                                            />
                                                            <Input
                                                                value={item.description || ''}
                                                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                                placeholder="Description (optional)"
                                                                className="h-7 text-xs"
                                                            />
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {readonly ? (
                                                        <span className="text-sm tabular-nums">{item.quantity}</span>
                                                    ) : (
                                                        <Input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                            min="0"
                                                            step="0.001"
                                                            className="h-8 text-sm tabular-nums"
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {readonly ? (
                                                        <span className="text-sm tabular-nums">{formatCurrency(item.unit_price)}</span>
                                                    ) : (
                                                        <Input
                                                            type="number"
                                                            value={item.unit_price}
                                                            onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                                            min="0"
                                                            step="0.01"
                                                            className="h-8 text-sm tabular-nums"
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-semibold tabular-nums">
                                                        {formatCurrency(item.line_total)}
                                                    </span>
                                                </TableCell>
                                                {!readonly && (
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-destructive"
                                                            onClick={() => removeItem(index)}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No line items. Click "Add Item" to add invoice items.
                            </p>
                        )}

                        {!readonly && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addItem}
                                className="w-full rounded-xl"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Item
                            </Button>
                        )}

                        {items.length > 0 && (
                            <div className="flex justify-between items-center pt-3 border-t">
                                <span className="text-sm font-medium">Total Amount:</span>
                                <span className="text-lg font-bold tabular-nums">{formatCurrency(totalAmount)}</span>
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
