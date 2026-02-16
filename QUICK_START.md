# Quick Start Guide - Eradaty

## ⚠️ IMPORTANT: You Must Run Migrations First!

Before you can use the app, you MUST run the database migrations in Supabase.

### Step 1: Run Migrations in Supabase

1. Go to: https://supabase.com/dashboard/project/iaasxnhayilbbhgdkesh/sql/new

2. Run these 3 SQL files **in order**:

   **First:** Copy and paste `migrations-combined.sql` → Click "Run"
   
   **Second:** Copy and paste `migrations-finance-combined.sql` → Click "Run"
   
   **Third:** Copy and paste `migrations-wallets-revenue-combined.sql` → Click "Run"

### Step 2: Sign Up

1. Go to: http://localhost:3004/signup
2. Create your account
3. Complete onboarding (create your brand)

### Step 3: Use the App

Now you can access all pages:

- **Costs Page**: http://localhost:3004/costs
  - You'll see a prominent **"Add Cost"** button in the top right
  - Click it to open the modal and create a cost entry

- **Revenue Page**: http://localhost:3004/revenue
  - Click **"Add Revenue"** to add manual revenue

- **Wallets Page**: http://localhost:3004/wallets
  - Click **"Add Wallet"** to create payment methods

- **Salaries Page**: http://localhost:3004/salaries
  - Click **"Add Employee"** and **"Record Payment"**

## Why Can't I See the Add Cost Button?

If you can't see the "Add Cost" button, it's because:

1. ❌ **You haven't run the migrations** - The database tables don't exist
2. ❌ **You're not logged in** - The page redirects to /login
3. ❌ **You haven't completed onboarding** - You need to create a brand first

## The Add Cost Button Location

Once logged in, the Costs page looks like this:

```
┌─────────────────────────────────────────────────────┐
│  Costs                            [+ Add Cost]      │  ← Button is here!
│  Track manual expenses and operating costs          │
├─────────────────────────────────────────────────────┤
│  Total Costs                                        │
│  0.00 EGP                                          │
├─────────────────────────────────────────────────────┤
│  No costs yet. Click "Add Cost" to get started.    │
└─────────────────────────────────────────────────────┘
```

## Need Help?

1. Check the server is running: http://localhost:3004
2. Check you've run all 3 migrations in Supabase
3. Make sure you're logged in
4. Make sure you completed onboarding

The "Add Cost" button is a blue button with a plus icon in the top right corner of the Costs page!
