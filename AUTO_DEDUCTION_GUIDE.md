# Auto-Deduction from Basic Wallet - How It Works

## ⚠️ Important: When Auto-Deduction Happens

### ✅ Auto-Deduction DOES Happen:
**Only when SALARY PAYMENTS are APPROVED**

1. Employee salary payment is recorded in `/salaries`
2. Payment creates a **Pending Cost** (requires admin approval)
3. Admin goes to `/costs` page
4. Admin clicks **Approve** on the pending salary payment
5. **System automatically deducts** from Basic Wallet
6. Wallet balance decreases immediately

### ❌ Auto-Deduction DOES NOT Happen:
**Manual costs added directly in `/costs` page**

When you manually add a cost using the "Add Cost" button:
- Cost is added to costs table
- Cost appears in costs list
- **NO deduction from wallet** (manual costs are for tracking only)
- You must manually manage wallet balance if needed

---

## 🔄 Complete Auto-Deduction Flow

### Step-by-Step Process:

```
1. Record Salary Payment (/salaries)
   ↓
2. Creates Pending Cost (status: pending)
   ↓
3. Admin sees pending cost in /costs (orange box)
   ↓
4. Admin clicks "Approve"
   ↓
5. System finds Basic Wallet (is_basic=true, is_active=true)
   ↓
6. Deducts amount from wallet.current_balance
   ↓
7. Creates wallet_transactions record (type: cost_deduction)
   ↓
8. Creates cost entry in costs table
   ↓
9. Creates cash_transactions record
   ↓
10. Wallet balance updated in UI
```

---

## 📋 Testing Auto-Deduction

### Correct Way to Test:

1. **Create Basic Wallet**
   - Go to `/wallets`
   - Add wallet with balance 10,000 EGP
   - Check "Set as Basic Wallet"
   - Check "Active" (or use toggle button)
   - Save

2. **Create Employee**
   - Go to `/salaries`
   - Add employee with monthly salary 5,000 EGP
   - Set as Active

3. **Record Salary Payment** (NOT manual cost!)
   - In `/salaries` page
   - Click "Record Payment"
   - Select employee
   - Enter amount: 5,000 EGP
   - Enter period: 2026-01
   - Click "Record Payment"

4. **Approve Payment**
   - Go to `/costs` page
   - See orange box "Pending Salary Payments"
   - Find your payment
   - Click **Approve** button

5. **Verify Deduction**
   - Go back to `/wallets`
   - Basic wallet balance should be: 5,000 EGP (10,000 - 5,000)
   - Check wallet_transactions table for deduction record

### ❌ Wrong Way (Will NOT Auto-Deduct):

1. Go to `/costs`
2. Click "Add Cost" button
3. Fill in manual cost form
4. Submit
5. **Result:** Cost added, but NO wallet deduction

---

## 🎯 Why This Design?

### Salary Payments = Approved Workflow
- Requires admin approval
- Creates audit trail
- Links to employee records
- Auto-deducts from wallet
- Sends notifications

### Manual Costs = Direct Entry
- For tracking expenses not related to salaries
- No approval needed
- No wallet integration
- Quick entry for miscellaneous costs

---

## 🔧 New Feature: Quick Active/Inactive Toggle

### Toggle Button on Wallet Cards

Each wallet card now has a **toggle button** below the View/Edit/Delete buttons:

**When Active:**
- Button shows: "⏸️ Set Inactive" (amber/orange color)
- Click to deactivate wallet
- Wallet becomes inactive immediately

**When Inactive:**
- Button shows: "▶️ Set Active" (green color)
- Click to activate wallet
- Wallet becomes active immediately

### How to Use:

1. Find wallet card
2. Click toggle button at bottom
3. Wallet status updates instantly
4. Status badge changes color (Green ↔ Gray)
5. No need to open edit modal

### Important Notes:

- **Basic Wallet must be Active** for auto-deduction to work
- If you deactivate the Basic Wallet, auto-deduction stops
- You can have multiple wallets, but only one can be Basic
- Inactive wallets still show in the list (gray badge)

---

## 📊 Database Records Created on Approval

When you approve a salary payment, the system creates:

### 1. Updates pending_costs
```sql
status = 'approved'
approved_by = admin_user_id
approved_at = current_timestamp
```

### 2. Inserts into costs
```sql
brand_id, date, category='operational', 
amount, note, source='manual'
```

### 3. Updates wallets (Basic Wallet)
```sql
current_balance = current_balance - amount
```

### 4. Inserts into wallet_transactions
```sql
wallet_id, amount, transaction_type='cost_deduction',
description, transaction_date, reference_type='salary_payment',
reference_id=salary_payment_id
```

### 5. Inserts into cash_transactions
```sql
date, section='operating', category='salaries',
amount=-amount, description, reference_type='salary_payment',
reference_id=salary_payment_id
```

---

## 🐛 Troubleshooting

### "I added a cost but wallet didn't deduct"

**Check:**
1. Did you add it via "Add Cost" button? → Manual costs don't auto-deduct
2. Did you record it as a salary payment? → Should go through approval
3. Did you approve it in /costs page? → Must click Approve button

### "I approved salary but wallet didn't deduct"

**Check:**
1. Is there a Basic Wallet? → Must have is_basic=true
2. Is Basic Wallet Active? → Must have is_active=true
3. Does Basic Wallet have enough balance? → Check current_balance
4. Check browser console for errors
5. Check wallet_transactions table for deduction record

### "Toggle button doesn't work"

**Check:**
1. Refresh the page after clicking
2. Check if API returned error (see error message at top)
3. Verify migration 0012 was run in Supabase
4. Check is_active column exists in wallets table

---

## ✅ Summary

**Auto-Deduction:**
- ✅ Salary payments (after approval)
- ❌ Manual costs (direct entry)

**Toggle Button:**
- ✅ Quick active/inactive switch
- ✅ No need to open edit modal
- ✅ Instant UI update
- ✅ Works on all wallets

**Requirements:**
- ✅ Basic Wallet must exist (is_basic=true)
- ✅ Basic Wallet must be Active (is_active=true)
- ✅ Salary payment must be approved by admin
- ✅ Migration 0012 must be run

---

## 🚀 Ready to Use!

The auto-deduction system is fully functional. Just remember:
- Use **Salary Payments** for auto-deduction
- Use **Manual Costs** for tracking only
- Keep **Basic Wallet Active** for auto-deduction to work
- Use **Toggle Button** for quick status changes

Happy tracking! 💰
