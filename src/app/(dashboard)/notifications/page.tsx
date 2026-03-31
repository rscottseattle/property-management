"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  DollarSign,
  FileText,
  Wrench,
  Home,
  AlertTriangle,
  Check,
  Trash2,
  ExternalLink,
  CheckCheck,
} from "lucide-react";
import { Button, Badge, Card, EmptyState, LoadingSkeleton } from "@/components/ui";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, typeof DollarSign> = {
  rent: DollarSign,
  rent_charge: DollarSign,
  lease: FileText,
  lease_expiring: FileText,
  maintenance: Wrench,
  vacancy: Home,
  vacant_unit: Home,
  late_fee: AlertTriangle,
};

function getTypeIcon(type: string) {
  return TYPE_ICONS[type] || Bell;
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

function NotificationSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="animate-pulse flex items-start gap-4 p-4">
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        </div>
      </div>
    </Card>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const limit = 50;

  const fetchNotifications = useCallback(
    async (offset = 0, append = false) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams({
          limit: String(limit),
          offset: String(offset),
        });
        if (filter === "unread") params.set("unreadOnly", "true");

        const res = await fetch(`/api/notifications?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (append) {
            setNotifications((prev) => [...prev, ...data.notifications]);
          } else {
            setNotifications(data.notifications);
          }
          setTotal(data.total);
          setUnreadCount(data.unreadCount);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function handleMarkAllRead() {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silently fail
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silently fail
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        const deleted = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setTotal((t) => t - 1);
        if (deleted && !deleted.read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
      }
    } catch {
      // silently fail
    }
  }

  const hasMore = notifications.length < total;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="default">{unreadCount} unread</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4 mr-1.5" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            filter === "all"
              ? "bg-white dark:bg-gray-700 text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            filter === "unread"
              ? "bg-white dark:bg-gray-700 text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Unread
        </button>
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description={
            filter === "unread"
              ? "You're all caught up! No unread notifications."
              : "You don't have any notifications yet."
          }
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = getTypeIcon(notification.type);
            return (
              <Card
                key={notification.id}
                className={`overflow-hidden transition-colors ${
                  !notification.read
                    ? "border-l-4 border-l-[#5c7c65]"
                    : ""
                }`}
              >
                <div className="flex items-start gap-4 p-4">
                  {/* Type icon */}
                  <div
                    className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg ${
                      notification.read
                        ? "bg-gray-100 dark:bg-gray-800 text-muted-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        notification.read
                          ? "text-muted-foreground"
                          : "font-semibold text-foreground"
                      }`}
                    >
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1.5">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {notification.link && (
                      <button
                        onClick={() => router.push(notification.link!)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="View"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    )}
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkRead(notification.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-[#c75a3a] hover:bg-[#fae8e3] dark:hover:bg-[#c75a3a]/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNotifications(notifications.length, true)}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
