"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OCRResult } from "@/lib/ocrService";

interface InvoiceUploadProps {
    context: 'cost' | 'revenue';
    onOCRComplete: (result: OCRResult) => void;
    onFileSelect?: (file: File | null) => void;
    disabled?: boolean;
}

export function InvoiceUpload({ context, onOCRComplete, onFileSelect, disabled }: InvoiceUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing' | 'success' | 'partial' | 'failed'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];

        if (!allowedTypes.includes(selectedFile.type)) {
            setError('Only PNG and JPG files are allowed');
            return;
        }

        if (selectedFile.size > maxSize) {
            setError('File size must be less than 5MB');
            return;
        }

        setFile(selectedFile);
        setError(null);
        onFileSelect?.(selectedFile);

        // Auto-process OCR
        await processOCR(selectedFile);
    };

    const processOCR = async (fileToProcess: File) => {
        setIsProcessing(true);
        setOcrStatus('processing');
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', fileToProcess);
            formData.append('context', context);

            const response = await fetch('/api/ocr/invoice', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'OCR processing failed');
            }

            const ocrResult: OCRResult = result.data;

            // Determine status based on confidence
            if (ocrResult.confidence.overall >= 0.7) {
                setOcrStatus('success');
            } else if (ocrResult.confidence.overall >= 0.4) {
                setOcrStatus('partial');
            } else {
                setOcrStatus('failed');
            }

            onOCRComplete(ocrResult);

        } catch (err: any) {
            console.error('OCR error:', err);
            setError(err.message || 'Failed to process invoice');
            setOcrStatus('failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const removeFile = () => {
        setFile(null);
        setError(null);
        setOcrStatus('idle');
        onFileSelect?.(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="space-y-3">
            <Label htmlFor="invoice-upload">
                {context === 'cost' ? 'Invoice/Receipt' : 'Invoice/Receipt'}
                <span className="text-muted-foreground text-xs ml-2">(Optional - Auto-fills form)</span>
            </Label>

            {!file ? (
                <div
                    className={cn(
                        "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
                        "hover:border-primary/40 hover:bg-primary/[0.02]",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => !disabled && fileInputRef.current?.click()}
                >
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Upload invoice or receipt</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">PNG, JPG up to 5MB</p>
                    <input
                        ref={fileInputRef}
                        id="invoice-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={disabled}
                    />
                </div>
            ) : (
                <div className="border rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="mt-1">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={removeFile}
                            disabled={isProcessing}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* OCR Status */}
                    {isProcessing && (
                        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <AlertDescription className="text-blue-900 dark:text-blue-100">
                                Reading invoice data...
                            </AlertDescription>
                        </Alert>
                    )}

                    {ocrStatus === 'success' && !isProcessing && (
                        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-900 dark:text-green-100">
                                Invoice data extracted successfully! Form fields have been auto-filled.
                            </AlertDescription>
                        </Alert>
                    )}

                    {ocrStatus === 'partial' && !isProcessing && (
                        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-900 dark:text-amber-100">
                                Partial data extracted. Please review and complete the form.
                            </AlertDescription>
                        </Alert>
                    )}

                    {(ocrStatus === 'failed' || error) && !isProcessing && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {error || "Couldn't read invoice. You can still enter data manually."}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}
        </div>
    );
}
