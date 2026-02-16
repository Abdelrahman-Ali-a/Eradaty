# Eradaty Setup Instructions

## ✅ What's Been Built

Your Eradaty app now includes:

### **Core Features**
- ✨ Premium Stripe/Linear-inspired UI with icons
- 📊 Dashboard with KPI cards and charts
- 💰 Revenue tracking (manual entries + Shopify orders)
- 💸 Costs tracking (manual expenses)
- 👥 Salaries management (employees + payments)
- 💳 Wallets (payment methods + budgets)
- 🏦 Finance inputs (equity, assets, working capital)
- 🔌 Integrations (Shopify + Meta Ads)

### **Financial Metrics API**
- Cash Flow (operating + investing + financing)
- Profitability (Net Profit, ROI, ROE, ROA, Net Profit Margin)
- Efficiency (DIO, DSO, DPO, CCC)

## 🚀 Setup Steps

### **1. Run Database Migrations**

You need to run these SQL files in your Supabase SQL Editor in order:

#### **Step 1: Initial Setup** (if not done yet)
Open: https://supabase.com/dashboard/project/iaasxnhayilbbhgdkesh/sql/new

Copy and run: `migrations-combined.sql`
- Creates: brands, costs, shopify_connections, shopify_orders, meta_connections, meta_daily_spend
- Enables RLS policies

#### **Step 2: Finance System**
Copy and run: `migrations-finance-combined.sql`
- Creates: cash_transactions, employees, salary_payments, assets, equity_snapshots, working_capital_snapshots
- Adds finance enums and RLS policies

#### **Step 3: Wallets & Revenue**
Copy and run: `migrations-wallets-revenue-combined.sql`
- Creates: wallets, wallet_transactions, manual_revenues
- Adds RLS policies

### **2. Access Your App**

Visit: `http://localhost:3004`

1. **Sign up** at `/signup`
2. **Complete onboarding** - create your brand
3. **Start using the app!**

## 📱 Available Pages

### **Navigation (with icons)**
- 📊 **Dashboard** - KPI cards, charts, date filters
- 📈 **Revenue** - Manual revenue entries + Shopify orders
- 📉 **Costs** - Manual expense tracking
- 💳 **Wallets** - Payment methods with budgets
- 👥 **Salaries** - Employee management + salary payments
- 🏦 **Finance** - Equity/Assets/Working Capital snapshots
- 🔌 **Integrations** - Connect Shopify & Meta Ads

## 💡 How to Use

### **Track Revenue**
1. Go to `/revenue`
2. Click "Add Revenue" to manually add income
3. Or sync Shopify orders from Integrations

### **Track Costs**
1. Go to `/costs`
2. Click "Add cost"
3. Select category: inventory_purchase, operational, shipping_fulfillment, packaging, marketing_other, or other

### **Manage Wallets**
1. Go to `/wallets`
2. Click "Add Wallet"
3. Set up bank accounts, cash, or digital wallets
4. Set monthly budgets to track spending

### **Pay Salaries**
1. Go to `/salaries`
2. Add employees first
3. Record salary payments (auto-creates cash transactions)

### **Track Finance Data**
1. Go to `/finance-inputs`
2. Add equity snapshots
3. Add working capital data (inventory, A/R, A/P, cash)
4. Add assets with depreciation

## 🎨 Design Features

- ✅ Lucide React icons throughout
- ✅ Premium color palette with semantic tokens
- ✅ Smooth animations and transitions
- ✅ Professional form inputs with focus states
- ✅ Responsive design
- ✅ Clean typography and spacing

## 🔧 Technical Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Language**: TypeScript

## 📝 Notes

- All pages have proper RLS policies (users only see their own brand data)
- Salary payments automatically create cash transactions
- Shopify and Meta Ads integrations require OAuth setup
- Financial metrics are calculated in real-time from your data

## 🐛 Troubleshooting

**Can't create costs/revenue?**
- Make sure you've run all migrations in Supabase
- Check that you completed onboarding (created a brand)

**Icons not showing?**
- The app should have lucide-react installed
- Restart the dev server if needed

**Database errors?**
- Verify all migrations ran successfully in Supabase
- Check RLS policies are enabled

## 🎉 You're All Set!

Your Eradaty app is now a comprehensive finance management system with:
- Revenue & expense tracking
- Wallet & budget management
- Employee salary tracking
- Financial metrics & KPIs
- Premium modern UI

Enjoy managing your brand's finances! 💰
