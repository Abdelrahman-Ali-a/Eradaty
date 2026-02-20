/**
 * OCR Invoice Processing Service
 * Uses OpenAI GPT-4 Vision API for invoice data extraction
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
 * Process invoice image using AI Vision (supports OpenAI GPT-4 Vision or Grok Vision)
 */
export async function processInvoiceWithOCR(
    imageBase64: string,
    context: 'cost' | 'revenue'
): Promise<OCRResult> {
    const openaiKey = process.env.OPENAI_API_KEY;
    const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;

    // Determine which API to use
    const useGrok = grokKey && !openaiKey;
    const apiKey = useGrok ? grokKey : openaiKey;

    if (!apiKey) {
        throw new Error('No AI API key configured. Set OPENAI_API_KEY or GROK_API_KEY in environment variables.');
    }

    const systemPrompt = `You are an expert invoice data extraction system. Extract structured data from invoice images.

CRITICAL RULES:
1. Return ONLY valid JSON matching the exact schema provided
2. Normalize dates to YYYY-MM-DD format
3. Convert all amounts to decimal numbers (remove currency symbols, commas)
4. Confidence scores: 0.0 (no data) to 1.0 (certain)
5. If a field is unclear, omit it or set confidence low
6. For ${context === 'cost' ? 'costs' : 'revenue'}, focus on ${context === 'cost' ? 'vendor and category' : 'customer and source'}

Return JSON schema:
{
  "context": "${context}",
  "fields": {
    "date": "YYYY-MM-DD or null",
    "amount": number or null,
    ${context === 'revenue' ? '"source": "string or null", "customer": "string or null",' : '"category": "string or null", "vendor": "string or null",'}
    "description": "string or null",
    ${context === 'cost' ? '"recurring": boolean,' : ''}
  },
  "items": [
    {
      "name": "string",
      "quantity": number,
      "unit_price": number,
      "line_total": number,
      "sku": "string or null",
      "tax": number or null
    }
  ],
  "invoice": {
    "invoice_number": "string or null",
    "currency": "EGP|USD|EUR|...",
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

    try {
        const apiUrl = useGrok
            ? 'https://api.x.ai/v1/chat/completions'
            : 'https://api.openai.com/v1/chat/completions';

        const model = useGrok ? 'grok-2-vision-1212' : 'gpt-4o';

        console.log(`Using ${useGrok ? 'Grok' : 'OpenAI'} for OCR processing...`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model,
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
                                text: `Extract all invoice data from this ${context} invoice/receipt. Return only JSON.`,
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${imageBase64}`,
                                    detail: 'high',
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 2000,
                temperature: 0.1, // Low temperature for consistent extraction
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

        // Extract JSON from response (handle markdown code blocks)
        let jsonText = content.trim();
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```\n?$/g, '');
        }

        const result: OCRResult = JSON.parse(jsonText);

        // Validate and sanitize
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
    // Ensure context matches
    result.context = context;

    // Sanitize fields
    if (result.fields) {
        // Normalize date
        if (result.fields.date) {
            result.fields.date = normalizeDate(result.fields.date);
        }

        // Normalize amount
        if (result.fields.amount) {
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
    }

    // Sanitize items
    if (result.items && Array.isArray(result.items)) {
        result.items = result.items.map((item: any) => ({
            name: String(item.name || ''),
            description: item.description ? String(item.description) : undefined,
            quantity: parseFloat(String(item.quantity || 1)),
            unit_price: parseFloat(String(item.unit_price || 0)),
            line_total: parseFloat(String(item.line_total || 0)),
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
            subtotal: parseFloat(String(result.invoice.subtotal || 0)),
            tax: parseFloat(String(result.invoice.tax || 0)),
            total: parseFloat(String(result.invoice.total || 0)),
        };
    }

    // Ensure confidence scores
    if (!result.confidence) {
        result.confidence = {
            date: 0,
            amount: 0,
            vendor_or_customer: 0,
            items: 0,
            overall: 0,
        };
    }

    return result as OCRResult;
}

/**
 * Normalize date to YYYY-MM-DD format
 */
function normalizeDate(dateStr: string): string {
    try {
        // Try parsing various date formats
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            return dateStr; // Return original if can't parse
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
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
 * Validate file before upload
 */
export function validateInvoiceFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Only PNG and JPG files are allowed' };
    }

    if (file.size > maxSize) {
        return { valid: false, error: 'File size must be less than 5MB' };
    }

    return { valid: true };
}
