import {
    LayoutDashboard,
    TrendingUp,
    Receipt,
    Wallet,
    Users,
    PieChart,
    Plug,
    Bell,
} from "lucide-react";

export const navItems = [
    { key: "nav.dashboard", path: "/dashboard", icon: LayoutDashboard },
    { key: "nav.revenue", path: "/revenue", icon: TrendingUp },
    { key: "nav.costs", path: "/costs", icon: Receipt },
    { key: "nav.wallets", path: "/wallets", icon: Wallet },
    { key: "nav.salaries", path: "/salaries", icon: Users },
    { key: "nav.finance", path: "/finance-inputs", icon: PieChart },
    { key: "nav.integrations", path: "/integrations", icon: Plug },
    { key: "nav.notifications", path: "/notifications", icon: Bell },
];
