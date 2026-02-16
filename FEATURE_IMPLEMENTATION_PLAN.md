# Feature Implementation Plan

## ✅ COMPLETED (Critical Bug Fixes)

### 1. Fixed Notification Bell Error
- **Issue**: Runtime TypeError "Failed to fetch" in NotificationsDropdown
- **Solution**: Added try-catch error handling to prevent UI breakage
- **File**: `components/NotificationsDropdown.tsx`

### 2. Fixed Notification Field Mismatch
- **Issue**: Using `is_read` instead of `read` in salary payment API
- **Solution**: Changed to correct field name `read`
- **File**: `app/api/salary-payments/route.ts`

### 3. Added Wallet Edit API
- **Feature**: PUT endpoint to edit wallet name, balance, and active status
- **File**: `app/api/wallets/[id]/route.ts`

### 4. Created Comprehensive Database Migration
- **Migration**: `0012_comprehensive_features.sql`
- **Includes**:
  - Wallet system with `is_basic` and `is_active` flags
  - Wallet transfers table
  - Wallet transactions table (add/deduct)
  - Monthly budget limits table
  - Predictive insights table
  - All RLS policies and indexes

---

## 🚧 IN PROGRESS (Requires Implementation)

### Priority 1: Core Wallet Features

#### 11. Edit Wallets & Employees with Active/Inactive Status
**Status**: 50% Complete
- ✅ Database: Added `is_active` column to wallets
- ✅ API: Created PUT endpoint for wallets
- ⏳ UI: Need to add edit modal in wallets page
- ⏳ Employees: Need to add edit functionality with active toggle

**Next Steps**:
1. Update wallets page UI with edit button and modal
2. Add active/inactive toggle in wallet form
3. Add edit functionality to employees in salaries page
4. Add active/inactive toggle for employees

---

#### 12. Basic Wallet System with Auto-Deduction
**Status**: 30% Complete
- ✅ Database: Added `is_basic` flag with unique constraint
- ✅ Database: Created wallet_transactions table
- ⏳ API: Need endpoint to deduct costs from basic wallet
- ⏳ API: Need wallet transfer endpoint
- ⏳ Logic: Auto-deduct costs from basic wallet when approved
- ⏳ UI: Add wallet transfer interface
- ⏳ UI: Add add/deduct balance interface

**Next Steps**:
1. Create API endpoint: `/api/wallet-transfers`
2. Create API endpoint: `/api/wallet-transactions`
3. Update pending cost approval to deduct from basic wallet
4. Add transfer UI in wallets page
5. Add add/deduct balance UI

---

### Priority 2: Data Management

#### 13. Bulk Upload & Export (Excel/PDF)
**Status**: 0% Complete
- ⏳ Install dependencies: `xlsx`, `jspdf`, `jspdf-autotable`
- ⏳ Create upload API for Shopify orders
- ⏳ Create upload API for manual orders
- ⏳ Create export API for Excel
- ⏳ Create export API for PDF
- ⏳ Add upload UI with file input
- ⏳ Add export buttons in revenue page

**Next Steps**:
1. Install packages: `npm install xlsx jspdf jspdf-autotable`
2. Create `/api/orders/import` endpoint
3. Create `/api/orders/export` endpoint
4. Add upload button and file handler in revenue page
5. Add export buttons (Excel/PDF) in revenue page

---

#### 14. Edit Salary Payments with Cost Sync
**Status**: 0% Complete
- ⏳ Add PUT endpoint for salary payments
- ⏳ Logic: Update linked cost when salary payment edited
- ⏳ Logic: Only sync if payment is approved
- ⏳ UI: Add edit button in salary payments table
- ⏳ UI: Add edit modal with form

**Next Steps**:
1. Create PUT endpoint: `/api/salary-payments/[id]`
2. Check if payment has approved pending_cost
3. If approved, update corresponding cost entry
4. Add edit functionality to salaries page UI

---

### Priority 3: Budget & Notifications

#### 15. Monthly Budget Limit Notifications
**Status**: 20% Complete
- ✅ Database: Created monthly_budgets table
- ⏳ API: Create budget CRUD endpoints
- ⏳ Logic: Check budget on cost approval
- ⏳ Logic: Send notification when exceeded
- ⏳ UI: Add budget settings page
- ⏳ UI: Display budget progress in dashboard

**Next Steps**:
1. Create `/api/monthly-budgets` endpoints
2. Add budget check in pending cost approval
3. Send notification when budget exceeded
4. Create budget settings UI
5. Add budget progress bar in dashboard

---

### Priority 4: Advanced Features

#### 0. Predictive Insights
**Status**: 10% Complete
- ✅ Database: Created predictive_insights table
- ⏳ API: Create insights generation logic
- ⏳ Logic: Calculate revenue forecasts
- ⏳ Logic: Calculate cost forecasts
- ⏳ Logic: Detect trends
- ⏳ UI: Create insights dashboard page
- ⏳ UI: Display insights in main dashboard

**Next Steps**:
1. Create `/api/predictive-insights` endpoint
2. Implement forecasting algorithms (moving average, trend analysis)
3. Generate insights based on historical data
4. Create insights page UI
5. Add insights widget to dashboard

---

## 📋 MIGRATIONS TO RUN

Run these in order in Supabase SQL Editor:

1. ✅ `0009_pending_costs.sql` (with DROP POLICY fix)
2. ✅ `0010_costs_references.sql`
3. ✅ `0011_notification_payment_type.sql`
4. ⏳ `0012_comprehensive_features.sql` **(RUN THIS NEXT)**

---

## 🐛 KNOWN ISSUES

### Dashboard Total Costs Not Showing
**Possible Causes**:
1. No costs data in database for selected date range
2. Costs table might be empty
3. Check if manual costs or Meta ads data exists

**Debug Steps**:
1. Check Supabase: `SELECT * FROM costs WHERE brand_id = 'your-brand-id';`
2. Check date range in dashboard matches data
3. Verify costs are being created when pending costs are approved

---

## 📊 IMPLEMENTATION PRIORITY

1. **IMMEDIATE** (Critical Bugs): ✅ DONE
2. **HIGH** (Core Features):
   - Complete wallet edit UI
   - Add employee edit functionality
   - Implement basic wallet auto-deduction
   - Add wallet transfers

3. **MEDIUM** (Data Management):
   - Bulk upload/export
   - Edit salary payments with sync

4. **LOW** (Advanced):
   - Budget limits
   - Predictive insights

---

## 🔧 TECHNICAL NOTES

### Wallet System Architecture
- One "Basic Wallet" per brand (enforced by unique index)
- All costs auto-deduct from basic wallet when approved
- Active/inactive status controls which wallets are usable
- Transfers between wallets create transaction records

### Budget System
- Monthly budgets stored as YYYY-MM format
- Check on every cost approval
- Send notification when 90% and 100% thresholds reached

### Predictive Insights
- Use last 3-6 months of data
- Simple moving average for forecasts
- Trend detection using linear regression
- Confidence scores based on data consistency

---

## 📝 NEXT IMMEDIATE ACTIONS

1. Run migration `0012_comprehensive_features.sql`
2. Implement wallet edit UI in wallets page
3. Implement employee edit UI in salaries page
4. Create wallet transfer API and UI
5. Add basic wallet auto-deduction logic

