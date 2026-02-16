# Wallet Features Guide

## ✨ Visual Indicators

### Basic Wallet Display
When a wallet is set as the **Basic Wallet**, it will have:

1. **⭐ BASIC WALLET Badge** - Floating badge at the top with star icon (animated bounce)
2. **Amber Border & Gradient** - Golden amber border with gradient background
3. **Pulsing Animation** - Subtle pulse effect on the entire card
4. **Amber Icon Background** - Wallet icon has amber background instead of blue
5. **Auto-Deduct Badge** - Shows "Auto-Deduct" badge next to Active status

### Active/Inactive Status
Every wallet card shows its status:
- **Active** - Green badge (bg-green-100, text-green-700)
- **Inactive** - Gray badge (bg-gray-100, text-gray-700)

Status is determined by `wallet.is_active` or `wallet.active` field.

---

## 🔄 Auto-Deduction System

### How It Works

When a **salary payment** is approved in the Costs page:

1. **Admin approves** pending salary payment
2. **System finds** the Basic Wallet (where `is_basic = true` AND `is_active = true`)
3. **Deducts amount** from Basic Wallet's `current_balance`
4. **Creates transaction record** in `wallet_transactions` table with type `cost_deduction`
5. **Creates cost entry** in `costs` table
6. **Creates cash transaction** in `cash_transactions` table

### Code Flow
```
Approve Pending Cost
    ↓
Find Basic Wallet (is_basic=true, is_active=true)
    ↓
Deduct: new_balance = current_balance - cost_amount
    ↓
Update wallet.current_balance
    ↓
Insert wallet_transactions record
    ↓
Insert costs record
    ↓
Insert cash_transactions record
```

### API Implementation
**File**: `/app/api/pending-costs/[id]/route.ts` (Lines 97-127)

```javascript
// Deduct from basic wallet
const { data: basicWallet } = await supabase
  .from("wallets")
  .select("*")
  .eq("brand_id", brandId)
  .eq("is_basic", true)
  .eq("is_active", true)
  .single();

if (basicWallet) {
  const newBalance = basicWallet.current_balance - pendingCost.amount;
  
  await supabase
    .from("wallets")
    .update({ current_balance: newBalance })
    .eq("id", basicWallet.id);

  // Create wallet transaction record
  await supabase
    .from("wallet_transactions")
    .insert({
      brand_id: brandId,
      wallet_id: basicWallet.id,
      amount: pendingCost.amount,
      transaction_type: "cost_deduction",
      description: pendingCost.description,
      transaction_date: pendingCost.payment_date,
      reference_type: "salary_payment",
      reference_id: pendingCost.salary_payment_id,
    });
}
```

---

## 🎨 Animations

### CSS Animations Added
**File**: `/app/globals.css`

1. **pulse-slow** - 3s infinite pulse (opacity 1 → 0.85 → 1)
2. **bounce-slow** - 2s infinite bounce (translateY 0 → -4px → 0)
3. **fade-in** - 0.5s fade in on page load

### Usage
- `.animate-pulse-slow` - Applied to Basic Wallet card border
- `.animate-bounce-slow` - Applied to "BASIC WALLET" badge
- `.animate-fade-in` - Applied to page content

---

## 📋 How to Set Basic Wallet

### Option 1: When Creating New Wallet
1. Click **Add Wallet** button
2. Fill in wallet details
3. Check **"Set as Basic Wallet (main wallet for auto-deductions)"**
4. Check **"Active"** checkbox
5. Click **Add Wallet**

### Option 2: Edit Existing Wallet
1. Find wallet card
2. Click **Edit** button
3. Check **"Set as Basic Wallet (main wallet)"**
4. Ensure **"Active"** is checked
5. Click **Save Changes**

### Important Notes
- Only **ONE** basic wallet allowed per brand (database constraint)
- Basic wallet must be **Active** for auto-deduction to work
- If you set a new wallet as basic, the old basic wallet loses its basic status

---

## 🧪 Testing Auto-Deduction

### Step-by-Step Test

1. **Create Basic Wallet**
   - Go to `/wallets`
   - Add new wallet with balance 10,000 EGP
   - Check "Set as Basic Wallet" and "Active"
   - Save

2. **Create Employee**
   - Go to `/salaries`
   - Add employee with monthly salary 5,000 EGP
   - Set as Active

3. **Record Salary Payment**
   - Click "Record Payment"
   - Select employee
   - Enter amount: 5,000 EGP
   - Enter period: 2026-01
   - Save

4. **Approve Payment (Admin)**
   - Go to `/costs`
   - See pending salary payment in orange box
   - Click **Approve**

5. **Verify Deduction**
   - Go back to `/wallets`
   - Basic wallet balance should now be: 5,000 EGP (10,000 - 5,000)
   - Basic wallet should show pulsing animation and star badge

---

## 🎯 Visual Design

### Basic Wallet Card
```
┌─────────────────────────────────────────┐
│        ⭐ BASIC WALLET (bouncing)       │
├─────────────────────────────────────────┤
│ [✓] 🏦 Main Account          [Active]  │
│                           [Auto-Deduct] │
│                                         │
│ Current Balance                         │
│ 5,000.00 EGP                           │
│                                         │
│ [View] [Edit] [Delete]                 │
└─────────────────────────────────────────┘
  ↑ Amber border with gradient background
  ↑ Subtle pulsing animation
```

### Regular Active Wallet
```
┌─────────────────────────────────────────┐
│ [✓] 💳 Savings Account       [Active]  │
│                                         │
│ Current Balance                         │
│ 15,000.00 EGP                          │
│                                         │
│ [View] [Edit] [Delete]                 │
└─────────────────────────────────────────┘
  ↑ Normal border, no animation
```

### Inactive Wallet
```
┌─────────────────────────────────────────┐
│ [✓] 💰 Old Account          [Inactive] │
│                                         │
│ Current Balance                         │
│ 2,000.00 EGP                           │
│                                         │
│ [View] [Edit] [Delete]                 │
└─────────────────────────────────────────┘
  ↑ Gray status badge
```

---

## 🔍 Database Schema

### Wallets Table
```sql
- id (uuid)
- brand_id (uuid)
- name (text)
- type (text) - 'bank', 'cash', 'digital', 'other'
- current_balance (numeric)
- currency (text)
- is_basic (boolean) - NEW! Marks as basic wallet
- is_active (boolean) - NEW! Active/inactive status
- monthly_budget (numeric)
- description (text)
- created_at (timestamptz)
- updated_at (timestamptz)

CONSTRAINT: Only one is_basic=true per brand_id
```

### Wallet Transactions Table
```sql
- id (uuid)
- brand_id (uuid)
- wallet_id (uuid)
- amount (numeric)
- transaction_type (text) - 'add', 'deduct', 'cost_deduction'
- description (text)
- transaction_date (date)
- reference_type (text) - 'salary_payment', etc.
- reference_id (uuid)
- created_at (timestamptz)
```

---

## 📊 Transaction Types

1. **add** - Manual addition to wallet balance
2. **deduct** - Manual deduction from wallet balance
3. **cost_deduction** - Automatic deduction when cost approved

---

## ✅ Features Checklist

- [x] Active/Inactive status display on wallet cards
- [x] Visual animation for Basic Wallet (pulsing border)
- [x] "BASIC WALLET" badge with star icon (bouncing)
- [x] Amber color scheme for Basic Wallet
- [x] "Auto-Deduct" badge on Basic Wallet
- [x] Auto-deduction from Basic Wallet when cost approved
- [x] Wallet transaction record creation
- [x] Only one Basic Wallet per brand constraint
- [x] Basic Wallet must be Active for auto-deduction

---

## 🚀 Ready to Use!

All features are implemented and ready. Just:
1. **Run migration** `0012_comprehensive_features.sql` in Supabase
2. **Refresh browser** at http://localhost:3001
3. **Create a Basic Wallet** and test the auto-deduction flow!

The Basic Wallet will stand out with its golden appearance and animated badge! ⭐
