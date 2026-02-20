import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBrandId, requireUser } from "@/lib/brand";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await supabaseServer();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = await requireBrandId(supabase, user.id);
  if (!brandId) return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as any;
  const action = body?.action; // 'approve' or 'decline'

  if (!action || !["approve", "decline"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Get pending cost details
  const { data: pendingCost, error: fetchError } = await supabase
    .from("pending_costs")
    .select("*")
    .eq("id", params.id)
    .eq("brand_id", brandId)
    .single();

  if (fetchError || !pendingCost) {
    return NextResponse.json({ error: "Pending cost not found" }, { status: 404 });
  }

  if (pendingCost.status !== "pending") {
    return NextResponse.json({ error: "This cost has already been processed" }, { status: 400 });
  }

  if (action === "approve") {
    // Check monthly budget
    const month = pendingCost.payment_date.slice(0, 7); // YYYY-MM
    const { data: budget } = await supabase
      .from("monthly_budgets")
      .select("budget_limit")
      .eq("brand_id", brandId)
      .eq("month", month)
      .single();

    if (budget) {
      // Get total costs for this month
      const { data: monthlyCosts } = await supabase
        .from("costs")
        .select("amount")
        .eq("brand_id", brandId)
        .gte("date", `${month}-01`)
        .lte("date", `${month}-31`);

      const totalCosts = (monthlyCosts || []).reduce((sum, c) => sum + Number(c.amount), 0);
      const newTotal = totalCosts + pendingCost.amount;

      // Send notification if budget exceeded
      if (newTotal > budget.budget_limit) {
        await supabase
          .from("notifications")
          .insert({
            brand_id: brandId,
            type: "system",
            title: "Monthly Budget Exceeded",
            message: `Your costs for ${month} (${newTotal.toFixed(2)} EGP) have exceeded your budget limit of ${budget.budget_limit.toFixed(2)} EGP`,
            action_url: "/costs",
            read: false,
          });
      }
    }

    // Update pending cost status
    await supabase
      .from("pending_costs")
      .update({
        status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    // Create cost entry in costs table
    const { error: costError } = await supabase
      .from("costs")
      .insert({
        brand_id: brandId,
        date: pendingCost.payment_date,
        category: "operational",
        amount: pendingCost.amount,
        note: pendingCost.description,
        source: "manual",
      });

    if (costError) return NextResponse.json({ error: costError.message }, { status: 400 });

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

      // Check and update wallet's individual monthly budget
      if (basicWallet.monthly_budget) {
        const month = pendingCost.payment_date.slice(0, 7); // YYYY-MM

        // Get total costs deducted from this wallet for the current month
        const { data: walletMonthlyCosts } = await supabase
          .from("wallet_transactions")
          .select("amount")
          .eq("wallet_id", basicWallet.id)
          .eq("transaction_type", "cost_deduction")
          .gte("transaction_date", `${month}-01`)
          .lte("transaction_date", `${month}-31`);

        const totalWalletCosts = (walletMonthlyCosts || []).reduce((sum, c) => sum + Number(c.amount), 0) + pendingCost.amount;
        const remainingBudget = basicWallet.monthly_budget - totalWalletCosts;
        const budgetPercentage = (remainingBudget / basicWallet.monthly_budget) * 100;

        // Send notification if budget is under 20%
        if (budgetPercentage <= 20 && budgetPercentage > 0) {
          await supabase
            .from("notifications")
            .insert({
              brand_id: brandId,
              type: "warning",
              title: "Monthly Budget Low Warning",
              message: `Your wallet "${basicWallet.name}" has only ${remainingBudget.toFixed(2)} EGP (${budgetPercentage.toFixed(1)}%) remaining from its monthly budget of ${basicWallet.monthly_budget.toFixed(2)} EGP`,
              action_url: "/wallets",
              read: false,
            });
        }

        // Send notification if budget is exceeded
        if (budgetPercentage <= 0) {
          await supabase
            .from("notifications")
            .insert({
              brand_id: brandId,
              type: "system",
              title: "Monthly Budget Exceeded",
              message: `Your wallet "${basicWallet.name}" has exceeded its monthly budget by ${Math.abs(remainingBudget).toFixed(2)} EGP`,
              action_url: "/wallets",
              read: false,
            });
        }
      }
    }

    // Create cash transaction
    const { data: cashTx, error: txError } = await supabase
      .from("cash_transactions")
      .insert({
        brand_id: brandId,
        date: pendingCost.payment_date,
        section: "operating",
        category: "salaries",
        amount: -Math.abs(pendingCost.amount),
        description: pendingCost.description,
        reference_type: "salary_payment",
        reference_id: pendingCost.salary_payment_id,
      })
      .select()
      .single();

    if (txError) return NextResponse.json({ error: txError.message }, { status: 400 });

    // Link cash transaction to salary payment
    if (pendingCost.salary_payment_id) {
      await supabase
        .from("salary_payments")
        .update({ cash_transaction_id: cashTx.id })
        .eq("id", pendingCost.salary_payment_id);
    }

    return NextResponse.json({ ok: true, action: "approved" });
  } else {
    // Decline - just update status
    await supabase
      .from("pending_costs")
      .update({
        status: "declined",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    // Optionally delete the salary payment if declined
    if (pendingCost.salary_payment_id) {
      await supabase
        .from("salary_payments")
        .delete()
        .eq("id", pendingCost.salary_payment_id);
    }

    return NextResponse.json({ ok: true, action: "declined" });
  }
}
