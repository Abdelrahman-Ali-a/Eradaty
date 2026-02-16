"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi } from "@/hooks/useApi";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, AlertTriangle, TrendingUp, Check, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type NotificationType = "info" | "warning" | "success" | "revenue";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string;
  read: boolean; // Changed from read_at to match database
  action_required: boolean;
  action_type: string | null;
}

interface NotificationsResponse {
  notifications: Notification[];
}

const typeIcons: Record<NotificationType, React.ElementType> = {
  info: Bell,
  warning: AlertTriangle,
  success: Check,
  revenue: TrendingUp,
};

const typeColors: Record<NotificationType, string> = {
  info: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  revenue: "bg-success/10 text-success",
};

export default function Notifications() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<"all" | "unread" | "action">("all");

  const { data, loading, error, refetch } = useApi<NotificationsResponse>("/api/notifications");

  const items = data?.notifications || [];

  const filtered = items.filter((n) => {
    if (filter === "unread") return !n.read; // Changed from !n.read_at
    if (filter === "action") return n.action_required;
    return true;
  });

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const filters = [
    { key: "all" as const, label: t("label.all"), count: items.length },
    { key: "unread" as const, label: t("label.unread"), count: items.filter((n) => !n.read).length }, // Changed from !n.read_at
    { key: "action" as const, label: t("label.actionRequired"), count: items.filter((n) => n.action_required).length },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("nav.notifications")} subtitle="Stay updated on your activity" />
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
      <PageHeader title={t("nav.notifications")} subtitle="Stay updated on your activity" />

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            className="rounded-full h-8 text-xs"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.count > 0 && (
              <span
                className={cn(
                  "ms-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                  filter === f.key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {f.count}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="shadow-card rounded-2xl">
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n, i) => {
            const Icon = typeIcons[n.type as NotificationType] || Bell; // Fallback to Bell icon
            return (
              <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card
                  className={cn(
                    "shadow-card rounded-2xl transition-all duration-200 hover:shadow-card-hover",
                    !n.read && "border-s-2 border-s-primary" // Changed from !n.read_at
                  )}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5", typeColors[n.type as NotificationType] || typeColors.info)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={cn("text-sm", !n.read ? "font-bold text-foreground" : "font-medium text-foreground")}> {/* Changed from !n.read_at */}
                            {n.title}
                            {n.action_required && (
                              <span className="ms-2 inline-flex items-center px-1.5 py-0.5 rounded-md bg-warning/10 text-warning text-[10px] font-bold">
                                Action
                              </span>
                            )}
                          </p>
                          <p className="text-[12px] text-muted-foreground mt-0.5">{n.message}</p>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">{getTimeAgo(n.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No notifications to show</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
