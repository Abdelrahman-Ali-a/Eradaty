# Quick Start: OCR Invoice Workflow

## Setup (5 minutes)

### 1. Install Dependencies
All required dependencies are already in `package.json`. No additional installation needed.

### 2. Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API Keys
4. Create new secret key
5. Copy the key (starts with `sk-...`)

### 3. Configure Environment

Add to your `.env.local` file:

```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

### 4. Run Database Migration

```bash
# If using Supabase locally
supabase migration up

# Or apply directly to your database
psql -d your_database -f supabase/migrations/0013_invoice_ocr_system.sql
```

### 5. Start Development Server

```bash
npm run dev
```

## Test the Feature

### 1. Navigate to Costs or Revenue Page

```
http://localhost:3000/costs
# or
http://localhost:3000/revenue
```

### 2. Click "Add Cost" or "Add Revenue"

### 3. Upload Test Invoice

- Click the upload area
- Select a PNG or JPG invoice image (max 5MB)
- Wait 2-5 seconds for processing

### 4. Review Auto-Filled Data

- Check extracted fields (date, amount, vendor, etc.)
- Look for confidence indicators
- Review line items if multi-item invoice

### 5. Edit and Save

- Correct any incorrect data
- Add missing information
- Click "Save"

## Sample Test Invoices

Create test invoices with these characteristics:

### Simple Receipt
```
Date: 2026-02-15
Amount: $125.00
Vendor: Office Supplies Inc.
Description: Printer paper and pens
```

### Multi-Item Invoice
```
Invoice #: INV-2026-001
Date: 2026-02-14
Vendor: Tech Solutions Ltd.

Items:
- Laptop Stand x1 @ $45.00 = $45.00
- USB-C Cable x2 @ $12.50 = $25.00
- Wireless Mouse x1 @ $30.00 = $30.00

Subtotal: $100.00
Tax (10%): $10.00
Total: $110.00
```

## Verification Checklist

- [ ] Invoice uploads successfully
- [ ] "Reading invoice..." status appears
- [ ] Fields auto-populate
- [ ] Confidence badges show correctly
- [ ] Line items display (if multi-item)
- [ ] Can edit auto-filled fields
- [ ] Can save transaction
- [ ] Toast notifications work

## Troubleshooting

### "OPENAI_API_KEY not configured"
**Fix:** Add the API key to `.env.local` and restart the dev server

### "Failed to process invoice"
**Possible causes:**
- Invalid API key
- No API credits
- Network issue
- Image too large

**Fix:** Check console for detailed error message

### Low Confidence Scores
**Normal for:**
- Handwritten invoices
- Poor image quality
- Complex layouts
- Non-English text

**Solution:** Review and manually correct the data

## Cost Estimate

**OpenAI GPT-4 Vision Pricing:**
- ~$0.01-0.03 per invoice
- Based on image size and complexity

**Example monthly cost:**
- 100 invoices/month = ~$1-3
- 1,000 invoices/month = ~$10-30

## Next Steps

1. **Test with real invoices** from your business
2. **Monitor accuracy** and confidence scores
3. **Provide feedback** on extraction quality
4. **Customize** OCR prompts if needed (in `lib/ocrService.ts`)

## Support

- **Documentation:** See `OCR_INVOICE_WORKFLOW.md`
- **Issues:** Report bugs or feature requests
- **Questions:** Contact development team

---

**Ready to go!** Upload your first invoice and watch the magic happen ✨
