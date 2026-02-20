"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Download } from "lucide-react"
import * as XLSX from "xlsx"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"

interface BulkUploadProps {
    type: "cost" | "revenue"
    onUploadSuccess: () => void
}

export function BulkUpload({ type, onUploadSuccess }: BulkUploadProps) {
    const [open, setOpen] = useState(false)
    const [preview, setPreview] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]

            const reader = new FileReader()
            reader.onload = (evt) => {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: "binary" })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws)
                setPreview(data)
            }
            reader.readAsBinaryString(selectedFile)
        }
    }

    const handleDownloadTemplate = () => {
        const headers = type === "cost"
            ? ["Date", "Amount", "Category", "Vendor", "Description", "Recurring"]
            : ["Date", "Amount", "Source", "Customer", "Description"];

        const ws = XLSX.utils.aoa_to_sheet([headers]);

        // Add sample row
        const sample = type === "cost"
            ? ["2024-01-01", 1000, "Marketing", "Facebook", "Ads", "no"]
            : ["2024-01-01", 1500, "Direct Sales", "Client X", "Consulting Project"];

        XLSX.utils.sheet_add_aoa(ws, [sample], { origin: -1 });

        // Auto-width columns
        const wscols = headers.map(h => ({ wch: h.length + 10 }));
        ws['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, `${type}_import_template.xlsx`);
    }

    const handleUpload = async () => {
        if (!preview.length) return
        setLoading(true)
        try {
            const endpoint = type === "cost" ? "/api/costs/bulk" : "/api/revenues/bulk"
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: preview }),
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Upload failed")

            toast.success(`${result.count || preview.length} items uploaded successfully`)
            setOpen(false)
            setPreview([])
            onUploadSuccess()
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || "Upload failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Import {type === "cost" ? "Costs" : "Revenue"}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bulk Upload {type === "cost" ? "Costs" : "Revenue"}</DialogTitle>
                    <DialogDescription>
                        Upload an Excel or CSV file to import data in bulk.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex justify-between items-center bg-secondary/20 p-4 rounded-lg border border-secondary/50">
                        <div className="text-sm font-medium">
                            Need a template?
                        </div>
                        <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2 bg-background hover:bg-accent hover:text-accent-foreground border-input shadow-sm">
                            <Download className="h-4 w-4" />
                            Download Template
                        </Button>
                    </div>

                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
                    </div>

                    {preview.length > 0 && (
                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg border">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-green-600 font-semibold">✓</span>
                                <span>Ready to import {preview.length} rows</span>
                            </div>
                            <div className="text-xs text-muted-foreground/80 break-words">
                                Columns found: {Object.keys(preview[0] || {}).join(", ")}
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpload} disabled={!preview.length || loading}>
                            {loading ? "Uploading..." : "Import Data"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
