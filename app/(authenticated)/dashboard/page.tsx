"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi } from "@/hooks/useApi";
import { KPICard } from "@/components/KPICard";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";

interface DashboardData {
    range: { start: string; end: string };
    totals: {
        grossRevenue: number;
        netRevenue: number;
        totalCosts: number;
        profit: number;
    };
    byCategory: Record<string, number>;
    daily: Array<{
        date: string;
        revenueNet: number;
        costs: number;
        profit: number;
    }>;
}

function toISODate(d: Date) {
    return d.toISOString().slice(0, 10);
}

export default function Dashboard() {
    const { t } = useLanguage();

    // Default to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [startDate, setStartDate] = useState(toISODate(thirtyDaysAgo));
    const [endDate, setEndDate] = useState(toISODate(today));
    const [apiEndpoint, setApiEndpoint] = useState(`/api/dashboard?start=${toISODate(thirtyDaysAgo)}&end=${toISODate(today)}`);

    const { data, loading, error, refetch } = useApi<DashboardData>(apiEndpoint);

    const handleApplyDateRange = () => {
        setApiEndpoint(`/api/dashboard?start=${startDate}&end=${endDate}`);
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "EGP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Transform byCategory into array for display
    const costBreakdown = data?.byCategory
        ? Object.entries(data.byCategory)
            .map(([category, amount]) => ({
                category: category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                amount: formatCurrency(amount),
                value: amount,
            }))
            .sort((a, b) => b.value - a.value)
        : [];

    const totalCostsForPercentage = costBreakdown.reduce((sum, item) => sum + item.value, 0);
    const costBreakdownWithPct = costBreakdown.map((item) => ({
        ...item,
        pct: totalCostsForPercentage > 0 ? Math.round((item.value / totalCostsForPercentage) * 100) : 0,
    }));

    // Transform daily data for chart
    const chartData = data?.daily?.map((day) => ({
        day: new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: Math.round(day.revenueNet),
        costs: Math.round(day.costs),
        profit: Math.round(day.profit),
    })) || [];

    if (error) {
        return (
            <div className="space-y-6">
                <PageHeader title={t("nav.dashboard")} subtitle="Overview of your ecommerce finances" />
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error}
                        <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-4">
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader title={t("nav.dashboard")} subtitle="Overview of your ecommerce finances">
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-[140px] text-sm rounded-xl"
                    />
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-[140px] text-sm rounded-xl"
                    />
                    <Button size="sm" className="rounded-xl" onClick={handleApplyDateRange} disabled={loading}>
                        {t("action.apply")}
                    </Button>
                </div>
            </PageHeader>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="shadow-card border rounded-2xl">
                            <CardContent className="p-6">
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-8 w-32 mb-2" />
                                <Skeleton className="h-3 w-28" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        title={t("kpi.grossRevenue")}
                        value={formatCurrency(data?.totals.grossRevenue || 0)}
                        icon={DollarSign}
                        trend=""
                        trendUp
                        delay={0}
                    />
                    <KPICard
                        title={t("kpi.netRevenue")}
                        value={formatCurrency(data?.totals.netRevenue || 0)}
                        icon={TrendingUp}
                        trend=""
                        trendUp
                        delay={80}
                    />
                    <KPICard
                        title={t("kpi.totalCosts")}
                        value={formatCurrency(data?.totals.totalCosts || 0)}
                        icon={TrendingDown}
                        trend=""
                        trendUp={false}
                        delay={160}
                    />
                    <KPICard
                        title={t("kpi.profit")}
                        value={formatCurrency(data?.totals.profit || 0)}
                        icon={PiggyBank}
                        trend=""
                        trendUp={(data?.totals.profit ?? 0) >= 0}
                        delay={240}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="lg:col-span-2"
                >
                    <Card className="shadow-card border rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">{t("label.dailyTrend")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-[300px] w-full" />
                            ) : chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "12px",
                                                fontSize: 12,
                                                boxShadow: "0 4px 16px rgb(0 0 0 / 0.08)",
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="hsl(var(--chart-1))"
                                            strokeWidth={2.5}
                                            dot={false}
                                            name="Revenue"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="costs"
                                            stroke="hsl(var(--chart-3))"
                                            strokeWidth={2}
                                            dot={false}
                                            name="Costs"
                                            strokeDasharray="4 4"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="profit"
                                            stroke="hsl(var(--chart-2))"
                                            strokeWidth={2.5}
                                            dot={false}
                                            name="Profit"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                                    No data available for this date range
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                    <Card className="shadow-card border rounded-2xl h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">{t("label.costBreakdown")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="space-y-2">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-2 w-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : costBreakdownWithPct.length > 0 ? (
                                <div className="space-y-4">
                                    {costBreakdownWithPct.map((item) => (
                                        <div key={item.category} className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-foreground">{item.category}</span>
                                                <div className="text-end">
                                                    <span className="text-sm font-semibold tabular-nums text-foreground">{item.amount}</span>
                                                    <span className="text-[11px] text-muted-foreground ms-2 tabular-nums">{item.pct}%</span>
                                                </div>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-primary/70 transition-all duration-700"
                                                    style={{ width: `${item.pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground text-center py-8">No cost data available</div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
