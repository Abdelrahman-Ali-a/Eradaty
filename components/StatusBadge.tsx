import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "connected" | "disconnected" | "pending" | "active" | "inactive" | "auto" | "credit" | "debit" | "unread";
  label: string;
}

const statusStyles: Record<string, string> = {
  connected: "bg-success/10 text-success border-success/20",
  active: "bg-success/10 text-success border-success/20",
  auto: "bg-success/10 text-success border-success/20",
  credit: "bg-success/10 text-success border-success/20",
  disconnected: "bg-muted text-muted-foreground border-border",
  inactive: "bg-muted text-muted-foreground border-border",
  debit: "bg-destructive/10 text-destructive border-destructive/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  unread: "bg-primary/10 text-primary border-primary/20",
};

const dotStyles: Record<string, string> = {
  connected: "bg-success",
  active: "bg-success",
  auto: "bg-success",
  credit: "bg-success",
  disconnected: "bg-muted-foreground",
  inactive: "bg-muted-foreground",
  debit: "bg-destructive",
  pending: "bg-warning",
  unread: "bg-primary",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border", statusStyles[status])}>
      <span className={cn("w-1.5 h-1.5 rounded-full me-1.5", dotStyles[status])} />
      {label}
    </span>
  );
}
