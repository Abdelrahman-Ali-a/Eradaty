import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface KPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  delay?: number;
}

export function KPICard({ title, value, icon: Icon, trend, trendUp, className, delay = 0 }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 group",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-card-foreground tabular-nums tracking-tight">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/12 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      {trend && (
        <p className={cn("text-xs font-medium mt-3 flex items-center gap-1", trendUp ? "text-success" : "text-destructive")}>
          <span className={cn("inline-block w-1.5 h-1.5 rounded-full", trendUp ? "bg-success" : "bg-destructive")} />
          {trend}
        </p>
      )}
    </motion.div>
  );
}
