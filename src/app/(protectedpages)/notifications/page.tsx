"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Bell,
  Mail,
  MessageSquare,
  CheckCircle,
  Trash2,
  Search,
  User,
  Bot,
  Calendar,
  AlertTriangle,
  Info,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Define interfaces for our data types
interface Notification {
  id: string;
  content: string;
  sentAt: string;
  type:
    | "match"
    | "agent"
    | "system"
    | "welcome"
    | "schedule"
    | "account"
    | "subscription"
    | "error";
  status: "sent" | "delivered" | "read" | "failed";
  agentId?: string;
  resultId?: string;
  title: string;
  priority: "low" | "medium" | "high";
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

interface NotificationSettings {
  email: boolean;
  slack: boolean;
  browser: boolean;
  slackWebhook: string;
  highRelevanceOnly: boolean;
  dailyDigest: boolean;
  digestTime: string;
  notifyOnAgentCompletion: boolean;
  notifyOnScheduledRun: boolean;
  notifyOnAccountChanges: boolean;
  notifyOnSystemUpdates: boolean;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsList, setNotificationsList] = useState<Notification[]>(
    []
  );
  const [filteredNotifications, setFilteredNotifications] = useState<
    Notification[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      return;
    }

    if (status === "authenticated") {
      fetchNotifications();
    }
  }, [status]);

  useEffect(() => {
    filterNotifications();
  }, [
    notificationsList,
    searchQuery,
    typeFilter,
    statusFilter,
    priorityFilter,
  ]);

  const filterNotifications = () => {
    let filtered = [...notificationsList];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (notification) =>
          notification.content.toLowerCase().includes(query) ||
          notification.title.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (notification) => notification.type === typeFilter
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (notification) => notification.status === statusFilter
      );
    }

    // Filter by priority
    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (notification) => notification.priority === priorityFilter
      );
    }

    setFilteredNotifications(filtered);
  };

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/notification");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch notifications");
      }

      // Transform the data to match the Notification interface
      const transformedNotifications = data.notifications.map(
        (notification: any) => ({
          id: notification.id,
          content: notification.content,
          sentAt: notification.sentAt,
          type: notification.type,
          status: notification.status,
          agentId: notification.agentId,
          resultId: notification.resultId,
          title: notification.title || getDefaultTitle(notification.type),
          priority: notification.priority || "medium",
          actionUrl: notification.actionUrl,
          actionLabel: notification.actionLabel,
          metadata: notification.metadata || {},
        })
      );

      setNotificationsList(transformedNotifications);
      setFilteredNotifications(transformedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultTitle = (type: string): string => {
    switch (type) {
      case "match":
        return "New Content Match";
      case "agent":
        return "Agent Run Update";
      case "system":
        return "System Notification";
      case "welcome":
        return "Welcome to rSlashMiner";
      case "schedule":
        return "Scheduled Run Update";
      case "account":
        return "Account Update";
      case "subscription":
        return "Subscription Update";
      case "error":
        return "Error Alert";
      default:
        return "Notification";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "match":
        return <CheckCircle className="h-5 w-5" />;
      case "agent":
        return <Bot className="h-5 w-5" />;
      case "system":
        return <Info className="h-5 w-5" />;
      case "welcome":
        return <User className="h-5 w-5" />;
      case "schedule":
        return <Calendar className="h-5 w-5" />;
      case "account":
        return <User className="h-5 w-5" />;
      case "subscription":
        return <Bell className="h-5 w-5" />;
      case "error":
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "match":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "agent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "system":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "welcome":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400";
      case "schedule":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400";
      case "account":
        return "bg-sky-100 text-sky-800 dark:bg-sky-900/20 dark:text-sky-400";
      case "subscription":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="default">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return null;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notification/${id}/read`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to mark notification as read");
      }

      // Update local state
      setNotificationsList((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, status: "read" }
            : notification
        )
      );

      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notification/read-all", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.message || "Failed to mark all notifications as read"
        );
      }

      // Update local state
      setNotificationsList((prev) =>
        prev.map((notification) => ({ ...notification, status: "read" }))
      );

      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notification/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete notification");
      }

      // Update local state
      setNotificationsList((prev) =>
        prev.filter((notification) => notification.id !== id)
      );

      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const clearAllNotifications = async () => {
    try {
      const response = await fetch("/api/notification/clear-all", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to clear all notifications");
      }

      // Update local state
      setNotificationsList([]);
      toast.success("All notifications cleared");
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      toast.error("Failed to clear all notifications");
    }
  };

  const unreadCount = useMemo(
    () => notificationsList.filter((n) => n.status !== "read").length,
    [notificationsList]
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated on your monitoring results and agent activity
            </p>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
            </div>

            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex items-center gap-4 mt-2">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated on your monitoring results and agent activity
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark All as Read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllNotifications}
            disabled={notificationsList.length === 0}
          >
            Clear All
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All ({notificationsList.length})
          </TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col md:flex-row gap-4 mb-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="match">Content Match</SelectItem>
                <SelectItem value="agent">Agent Run</SelectItem>
                <SelectItem value="schedule">Scheduled Run</SelectItem>
                <SelectItem value="welcome">Welcome</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          <ScrollArea className="h-[calc(100vh-280px)]">
            <AnimatePresence>
              {filteredNotifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <Bell className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">
                        No notifications found
                      </h3>
                      <p className="text-muted-foreground text-center mt-2">
                        {searchQuery ||
                        typeFilter !== "all" ||
                        statusFilter !== "all" ||
                        priorityFilter !== "all"
                          ? "Try adjusting your filters to see more notifications."
                          : "You don't have any notifications at the moment."}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="mb-4"
                  >
                    <Card
                      className={cn(
                        notification.status !== "read" ? "border-primary" : "",
                        notification.priority === "high"
                          ? "border-destructive"
                          : ""
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full ${getTypeColor(
                                notification.type
                              )}`}
                            >
                              {getTypeIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3
                                  className={`font-medium ${
                                    notification.status === "read"
                                      ? ""
                                      : "font-semibold"
                                  }`}
                                >
                                  {notification.title}
                                </h3>
                                {notification.status !== "read" && (
                                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                                )}
                                {getPriorityBadge(notification.priority)}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.content}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(
                                    new Date(notification.sentAt),
                                    { addSuffix: true }
                                  )}
                                </span>
                                {notification.agentId && (
                                  <Link
                                    href={`/agents/${notification.agentId}`}
                                    className="text-xs text-primary hover:underline"
                                  >
                                    View Agent
                                  </Link>
                                )}
                                {notification.resultId && (
                                  <Link
                                    href={`/results?id=${notification.resultId}`}
                                    className="text-xs text-primary hover:underline"
                                  >
                                    View Result
                                  </Link>
                                )}
                                {notification.actionUrl && (
                                  <Link
                                    href={notification.actionUrl}
                                    className="text-xs text-primary hover:underline"
                                  >
                                    {notification.actionLabel || "View Details"}
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {notification.status !== "read" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                Mark as Read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                deleteNotification(notification.id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <AnimatePresence>
              {unreadCount === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <CheckCircle className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">All caught up!</h3>
                      <p className="text-muted-foreground text-center mt-2">
                        You've read all your notifications.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                notificationsList
                  .filter((notification) => notification.status !== "read")
                  .map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="mb-4"
                    >
                      <Card
                        className={cn(
                          "border-primary",
                          notification.priority === "high"
                            ? "border-destructive"
                            : ""
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full ${getTypeColor(
                                  notification.type
                                )}`}
                              >
                                {getTypeIcon(notification.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">
                                    {notification.title}
                                  </h3>
                                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                                  {getPriorityBadge(notification.priority)}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.content}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(
                                      new Date(notification.sentAt),
                                      { addSuffix: true }
                                    )}
                                  </span>
                                  {notification.agentId && (
                                    <Link
                                      href={`/agents/${notification.agentId}`}
                                      className="text-xs text-primary hover:underline"
                                    >
                                      View Agent
                                    </Link>
                                  )}
                                  {notification.resultId && (
                                    <Link
                                      href={`/results?id=${notification.resultId}`}
                                      className="text-xs text-primary hover:underline"
                                    >
                                      View Result
                                    </Link>
                                  )}
                                  {notification.actionUrl && (
                                    <Link
                                      href={notification.actionUrl}
                                      className="text-xs text-primary hover:underline"
                                    >
                                      {notification.actionLabel ||
                                        "View Details"}
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                Mark as Read
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  deleteNotification(notification.id)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
              )}
            </AnimatePresence>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
