import { NextRequest, NextResponse } from 'next/server';
import { processInvoiceWithOCR, fileToBase64, validateInvoiceFile } from '@/lib/ocrService';
import { supabaseServer } from '@/lib/supabaseServer';

export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds for OCR processing

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const supabase = await supabaseServer();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get brand
        const { data: brand } = await supabase
            .from('brands')
            .select('id')
            .eq('owner_user_id', user.id)
            .single();

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const context = formData.get('context') as 'cost' | 'revenue';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!context || !['cost', 'revenue'].includes(context)) {
            return NextResponse.json({ error: 'Invalid context. Must be "cost" or "revenue"' }, { status: 400 });
        }

        // Validate file
        const validation = validateInvoiceFile(file);
        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        // Log OCR processing start
        const { data: logEntry } = await supabase
            .from('ocr_processing_logs')
            .insert({
                brand_id: brand.id,
                transaction_type: context,
                file_name: file.name,
                file_size_bytes: file.size,
                processing_status: 'processing',
            })
            .select()
            .single();

        try {
            // Convert file to base64
            const base64Image = await fileToBase64(file);

            // Process with OCR
            const ocrResult = await processInvoiceWithOCR(base64Image, context);

            const processingTime = Date.now() - startTime;

            // Update log with success
            if (logEntry) {
                await supabase
                    .from('ocr_processing_logs')
                    .update({
                        processing_status: ocrResult.confidence.overall >= 0.7 ? 'success' : 'partial',
                        confidence_overall: ocrResult.confidence.overall,
                        extracted_data: ocrResult,
                        processing_time_ms: processingTime,
                    })
                    .eq('id', logEntry.id);
            }

            // Return OCR result
            return NextResponse.json({
                success: true,
                data: ocrResult,
                processing_time_ms: processingTime,
            });

        } catch (ocrError: any) {
            // Update log with failure
            if (logEntry) {
                await supabase
                    .from('ocr_processing_logs')
                    .update({
                        processing_status: 'failed',
                        error_message: ocrError.message || 'OCR processing failed',
                        processing_time_ms: Date.now() - startTime,
                    })
                    .eq('id', logEntry.id);
            }

            console.error('OCR processing error:', ocrError);

            return NextResponse.json({
                success: false,
                error: 'Failed to process invoice. Please try again or enter data manually.',
                details: process.env.NODE_ENV === 'development' ? ocrError.message : undefined,
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('OCR endpoint error:', error);
        return NextResponse.json({
            success: false,
            error: 'An error occurred while processing your request',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        }, { status: 500 });
    }
}
