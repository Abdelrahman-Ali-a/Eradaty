/**
 * OCR Invoice Processing Service
 * Uses AI Vision (Grok or OpenAI) for invoice data extraction
 * Supports: Arabic/RTL receipts, English billing reports, multi-transaction invoices
 */

export interface InvoiceLineItem {
    name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    sku?: string;
    tax?: number;
}

export interface InvoiceMetadata {
    invoice_number?: string;
    currency: string;
    subtotal: number;
    tax: number;
    total: number;
}

export interface FieldConfidence {
    date: number;
    amount: number;
    vendor_or_customer: number;
    items: number;
    overall: number;
}

export interface OCRResult {
    context: 'cost' | 'revenue';
    fields: {
        date?: string; // YYYY-MM-DD
        amount?: number;
        source?: string;
        customer?: string;
        category?: string;
        vendor?: string;
        description?: string;
        recurring?: boolean;
    };
    items: InvoiceLineItem[];
    invoice: InvoiceMetadata;
    confidence: FieldConfidence;
    raw_text?: string;
}

/**
 * Process invoice image using AI Vision (supports Grok Vision or OpenAI GPT-4o)
 */
export async function processInvoiceWithOCR(
    imageBase64: string,
    context: 'cost' | 'revenue',
    mimeType: string = 'image/jpeg'
): Promise<OCRResult> {
    const openaiKey = process.env.OPENAI_API_KEY;
    const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;

    const useGrok = grokKey && !openaiKey;
    const apiKey = useGrok ? grokKey : openaiKey;

    if (!apiKey) {
        throw new Error('No AI API key configured. Set OPENAI_API_KEY or GROK_API_KEY in environment variables.');
    }

    const contextLabel = context === 'cost' ? 'cost/expense' : 'revenue/income';
    const vendorOrCustomer = context === 'cost' ? 'vendor/supplier' : 'customer/source';

    const systemPrompt = `You are an expert invoice OCR system with deep knowledge of Arabic and English invoices.

## ARABIC RECEIPT RULES (CRITICAL):
- Arabic text is RIGHT-TO-LEFT. Read accordingly.
- Arabic receipt column order (right to left): الصنف (Item Name) | الكمية (Quantity) | القيمة (Price)
- Common Arabic invoice terms:
  - الفاتورة / رقم الفاتورة = Invoice Number
  - التاريخ = Date
  - الإجمالي / الإجمالى = Total
  - الإجمالي العام = Grand Total
  - الخصم = Discount
  - الضريبة / ضريبة القيمة المضافة = Tax/VAT
  - الكمية = Quantity
  - الصنف / الصنف = Item Name
  - القيمة / السعر = Price/Value
  - المورد / المطعم = Vendor/Restaurant
  - نقدي = Cash
  - الكاشير = Cashier
- The vendor name is usually at the very top of the receipt in large text
- ALWAYS extract every item line even if the name is in Arabic — keep the Arabic text exactly as-is in the "name" field
- For Arabic dates like 23/07/2024, parse as DD/MM/YYYY

## ENGLISH BILLING REPORT RULES:
- For multi-row transaction tables (Meta Ads, Google Ads, etc.): extract EACH ROW as a separate line item
- The total is usually labeled "Total amount billed" or similar
- VAT/Tax is usually shown separately at the bottom

## UNIVERSAL RULES:
1. Return ONLY a valid JSON object — no markdown, no explanation, no code blocks
2. Normalize all dates to YYYY-MM-DD format
3. Strip currency symbols from all numbers (EGP, $, £, etc.)
4. Confidence: 0.0 = not found, 1.0 = very certain
5. Never skip items — extract ALL line items visible in the document
6. If a field is missing, set it to null

Return this exact JSON structure:
{
  "context": "${context}",
  "fields": {
    "date": "YYYY-MM-DD or null",
    "amount": number or null,
    ${context === 'revenue'
            ? '"source": "platform/source name or null", "customer": "customer name or null",'
            : '"category": "Food & Beverage|Marketing|Software|Utilities|Rent|Salaries|Other or null", "vendor": "vendor/restaurant/company name or null",'
        }
    "description": "brief description or null",
    ${context === 'cost' ? '"recurring": true or false,' : ''}
  },
  "items": [
    {
      "name": "item name — keep Arabic text exactly as written",
      "quantity": number,
      "unit_price": number,
      "line_total": number,
      "sku": null,
      "tax": null
    }
  ],
  "invoice": {
    "invoice_number": "number or null",
    "currency": "EGP|USD|EUR|GBP|...",
    "subtotal": number,
    "tax": number,
    "total": number
  },
  "confidence": {
    "date": 0.0-1.0,
    "amount": 0.0-1.0,
    "vendor_or_customer": 0.0-1.0,
    "items": 0.0-1.0,
    "overall": 0.0-1.0
  }
}`;

    const userPrompt = `Extract ALL data from this ${contextLabel} invoice/receipt.

IMPORTANT:
- If this is an Arabic receipt: read RIGHT-TO-LEFT, extract every item row from the table (الصنف=name, الكمية=qty, القيمة=price), keep Arabic names exactly as written
- If this is a billing report: extract every transaction row as a separate item
- The vendor/company name is at the top of the document
- Return ONLY the JSON object with no extra text`;


    try {
        const apiUrl = useGrok
            ? 'https://api.x.ai/v1/chat/completions'
            : 'https://api.openai.com/v1/chat/completions';

        const model = useGrok ? 'grok-2-vision-1212' : 'gpt-4o';

        console.log(`Using ${useGrok ? 'Grok Vision' : 'OpenAI GPT-4o'} for OCR processing...`);

        // Determine correct MIME type for the image URL
        const imageMime = mimeType.startsWith('image/') ? mimeType : 'image/jpeg';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: userPrompt,
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${imageMime};base64,${imageBase64}`,
                                    detail: 'high',
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 4096,
                temperature: 0.1,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`${useGrok ? 'Grok' : 'OpenAI'} API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error(`No content returned from ${useGrok ? 'Grok' : 'OpenAI'}`);
        }

        // Robust JSON extraction — handles markdown blocks, Arabic text edge cases
        let jsonText = content.trim();

        // Strip markdown code blocks
        if (jsonText.includes('```')) {
            jsonText = jsonText.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '');
        }

        // Find the outermost JSON object
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonText = jsonText.slice(firstBrace, lastBrace + 1);
        }

        // Try to parse; if it fails, attempt auto-repair
        let result: OCRResult;
        try {
            result = JSON.parse(jsonText);
        } catch (parseError) {
            console.warn('Initial JSON parse failed, attempting repair...');
            // Replace unescaped newlines/tabs inside string values
            const repaired = jsonText
                .replace(/[\u0000-\u001F\u007F]/g, ' ') // strip control chars
                .replace(/\\'/g, "'")                    // unescape single quotes
                .replace(/,\s*([}\]])/g, '$1');          // trailing commas

            try {
                result = JSON.parse(repaired);
            } catch {
                // Last resort: extract what we can
                console.error('JSON repair failed. Raw content length:', content.length);
                throw new Error(`AI returned invalid JSON. Please try again. Raw error: ${parseError}`);
            }
        }

        return sanitizeOCRResult(result, context);

    } catch (error) {
        console.error('OCR processing error:', error);
        throw error;
    }
}

/**
 * Sanitize and validate OCR result
 */
function sanitizeOCRResult(result: any, context: 'cost' | 'revenue'): OCRResult {
    result.context = context;

    if (result.fields) {
        // Normalize date
        if (result.fields.date) {
            result.fields.date = normalizeDate(result.fields.date);
        }

        // Normalize amount
        if (result.fields.amount !== null && result.fields.amount !== undefined) {
            result.fields.amount = parseFloat(String(result.fields.amount).replace(/[^0-9.-]/g, ''));
        }

        // Remove irrelevant fields based on context
        if (context === 'cost') {
            delete result.fields.source;
            delete result.fields.customer;
        } else {
            delete result.fields.category;
            delete result.fields.vendor;
            delete result.fields.recurring;
        }

        // If amount is not set but invoice.total is, use that
        if (!result.fields.amount && result.invoice?.total) {
            result.fields.amount = result.invoice.total;
        }
    }

    // Sanitize items
    if (result.items && Array.isArray(result.items)) {
        result.items = result.items
            .filter((item: any) => item && item.name)
            .map((item: any) => ({
                name: String(item.name || ''),
                description: item.description ? String(item.description) : undefined,
                quantity: parseFloat(String(item.quantity || 1)) || 1,
                unit_price: parseFloat(String(item.unit_price || 0)) || 0,
                line_total: parseFloat(String(item.line_total || 0)) || 0,
                sku: item.sku ? String(item.sku) : undefined,
                tax: item.tax ? parseFloat(String(item.tax)) : undefined,
            }));
    } else {
        result.items = [];
    }

    // Sanitize invoice metadata
    if (result.invoice) {
        result.invoice = {
            invoice_number: result.invoice.invoice_number ? String(result.invoice.invoice_number) : undefined,
            currency: String(result.invoice.currency || 'EGP'),
            subtotal: parseFloat(String(result.invoice.subtotal || 0)) || 0,
            tax: parseFloat(String(result.invoice.tax || 0)) || 0,
            total: parseFloat(String(result.invoice.total || 0)) || 0,
        };
    } else {
        result.invoice = { currency: 'EGP', subtotal: 0, tax: 0, total: 0 };
    }

    // Ensure confidence scores
    if (!result.confidence) {
        result.confidence = { date: 0, amount: 0, vendor_or_customer: 0, items: 0, overall: 0 };
    }

    return result as OCRResult;
}

/**
 * Normalize date to YYYY-MM-DD format
 * Handles: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, ISO strings
 */
function normalizeDate(dateStr: string): string {
    try {
        if (!dateStr) return dateStr;

        // Already in YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

        // DD/MM/YYYY (common in Egypt/Arab world and EU)
        const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (ddmmyyyy) {
            const [, day, month, year] = ddmmyyyy;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        // Try native Date parse as fallback
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        return dateStr;
    } catch {
        return dateStr;
    }
}

/**
 * Convert a File to base64 string (server-side compatible)
 */
export async function fileToBase64(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
}

/**
 * Validate file before upload — supports images and PDF
 */
export function validateInvoiceFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB (increased for PDFs)
    const allowedTypes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'application/pdf',
    ];

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Only PNG, JPG, WebP and PDF files are allowed' };
    }

    if (file.size > maxSize) {
        return { valid: false, error: 'File size must be less than 10MB' };
    }

    return { valid: true };
}
