"use client"

import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet } from "lucide-react"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface ExportColumn {
    key: string
    header: string
    formatter?: (value: any) => string
}

interface ExportButtonsProps {
    data: any[]
    filename: string
    columns: ExportColumn[]
}

export function ExportButtons({ data, filename, columns }: ExportButtonsProps) {
    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new()
        const wsData = data.map(item => {
            const row: any = {}
            columns.forEach(col => {
                const val = item[col.key];
                const formattedVal = col.formatter
                    ? col.formatter(val)
                    : (val !== undefined && val !== null ? val : '');
                row[col.header] = formattedVal;
            })
            return row
        })
        const ws = XLSX.utils.json_to_sheet(wsData)

        // Auto-width columns
        const wscols = columns.map(c => ({ wch: c.header.length + 10 }));
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
        XLSX.writeFile(wb, `${filename}.xlsx`)
    }

    const handleExportPDF = () => {
        const doc = new jsPDF()
        const tableData = data.map(item => columns.map(col => {
            const val = item[col.key];
            return col.formatter
                ? col.formatter(val)
                : (val !== undefined && val !== null ? String(val) : '');
        }))
        const headers = columns.map(col => col.header)

        autoTable(doc, {
            head: [headers],
            body: tableData,
        })
        doc.save(`${filename}.pdf`)
    }

    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100" onClick={handleExportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
            </Button>
            <Button variant="outline" size="sm" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100" onClick={handleExportPDF}>
                <Download className="mr-2 h-4 w-4" />
                PDF
            </Button>
        </div>
    )
}
