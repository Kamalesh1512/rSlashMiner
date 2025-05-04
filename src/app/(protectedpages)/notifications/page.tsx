"use client";

import { useState, useEffect } from "react";
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
  Clock,
  CheckCircle,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { SlackConnect } from "@/components/slack/slack-connect";
import { useAllowedNotifications } from "@/hooks/usage-limits/use-allowed-notifications";

// Define interfaces for our data types
interface Notification {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  type: "match" | "agent" | "system";
  read: boolean;
  agentId?: string;
  agentName?: string;
  resultId?: string;
}

// Hardcoded data
const notifications: Notification[] = [
  {
    id: "1",
    title: "New high-relevance match found",
    content:
      "Your agent 'SaaS Product Monitor' found a new potential customer in r/startups with 95% relevance.",
    timestamp: "10 minutes ago",
    type: "match",
    read: false,
    agentId: "1",
    agentName: "SaaS Product Monitor",
    resultId: "1",
  },
  {
    id: "2",
    title: "Agent completed scheduled run",
    content:
      "Your agent 'Competitor Tracker' completed its scheduled run and found 3 new matches.",
    timestamp: "1 hour ago",
    type: "agent",
    read: false,
    agentId: "2",
    agentName: "Competitor Tracker",
  },
  {
    id: "3",
    title: "Weekly report available",
    content:
      "Your weekly monitoring report is now available. View it to see a summary of all matches from the past week.",
    timestamp: "1 day ago",
    type: "system",
    read: true,
  },
  {
    id: "4",
    title: "New match found",
    content:
      "Your agent 'Product Hunt Monitor' found a new match in r/ProductHunt with 82% relevance.",
    timestamp: "2 days ago",
    type: "match",
    read: true,
    agentId: "3",
    agentName: "Product Hunt Monitor",
    resultId: "4",
  },
  {
    id: "5",
    title: "Agent monitoring error",
    content:
      "Your agent 'SaaS Product Monitor' encountered an error while monitoring r/CustomerSuccess. Please check the agent settings.",
    timestamp: "3 days ago",
    type: "agent",
    read: true,
    agentId: "1",
    agentName: "SaaS Product Monitor",
  },
  {
    id: "6",
    title: "Subscription usage alert",
    content:
      "You've used 80% of your monthly monitoring requests. Consider upgrading your plan to avoid hitting limits.",
    timestamp: "4 days ago",
    type: "system",
    read: true,
  },
  {
    id: "7",
    title: "New high-relevance match found",
    content:
      "Your agent 'Competitor Tracker' found a new potential customer in r/marketing with 91% relevance.",
    timestamp: "5 days ago",
    type: "match",
    read: true,
    agentId: "2",
    agentName: "Competitor Tracker",
    resultId: "2",
  },
];

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsList, setNotificationsList] = useState<Notification[]>(
    []
  );
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    slack: false,
    slackWebhookUrl: "",
    highRelevanceOnly: false,
    dailyDigest: true,
    digestTime: "09:00",
  });

  const { availableAlerts } = useAllowedNotifications();

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setNotificationsList(notifications);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const markAsRead = (id: string) => {
    setNotificationsList((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotificationsList((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotificationsList((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const clearAllNotifications = () => {
    setNotificationsList([]);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const unreadCount = notificationsList.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All ({notificationsList.length})
          </TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="settings">Notification Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {notificationsList.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Bell className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No notifications</h3>
                <p className="text-muted-foreground text-center mt-2">
                  You don't have any notifications at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            notificationsList.map((notification) => (
              <Card
                key={notification.id}
                className={notification.read ? "" : "border-primary"}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          notification.type === "match"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : notification.type === "agent"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                        }`}
                      >
                        {notification.type === "match" && (
                          <CheckCircle className="h-5 w-5" />
                        )}
                        {notification.type === "agent" && (
                          <Clock className="h-5 w-5" />
                        )}
                        {notification.type === "system" && (
                          <Bell className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`font-medium ${
                              notification.read ? "" : "font-semibold"
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-primary"></span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.content}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {notification.timestamp}
                          </span>
                          {notification.agentId && (
                            <Link
                              href={`/agents/${notification.agentId}`}
                              className="text-xs text-primary hover:underline"
                            >
                              {notification.agentName}
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
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
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
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          {unreadCount === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <CheckCircle className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-muted-foreground text-center mt-2">
                  You've read all your notifications.
                </p>
              </CardContent>
            </Card>
          ) : (
            notificationsList
              .filter((notification) => !notification.read)
              .map((notification) => (
                <Card key={notification.id} className="border-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            notification.type === "match"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : notification.type === "agent"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                          }`}
                        >
                          {notification.type === "match" && (
                            <CheckCircle className="h-5 w-5" />
                          )}
                          {notification.type === "agent" && (
                            <Clock className="h-5 w-5" />
                          )}
                          {notification.type === "system" && (
                            <Bell className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {notification.title}
                            </h3>
                            <span className="h-2 w-2 rounded-full bg-primary"></span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.content}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {notification.timestamp}
                            </span>
                            {notification.agentId && (
                              <Link
                                href={`/agents/${notification.agentId}`}
                                className="text-xs text-primary hover:underline"
                              >
                                {notification.agentName}
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
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Methods</h3>
                {/* <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="email-notifications">
                        Email Notifications
                      </Label>
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.email}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          email: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="slack">Enable Slack Alerts</Label>
                    <Switch
                      id="slack"
                      checked={notificationSettings.slack}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          slack: checked,
                        }))
                      }
                    />
                  </div>

                  {notificationSettings.slack && (
                    <div className="space-y-2 pl-6">
                      <SlackConnect />
                      <p className="text-sm text-muted-foreground">
                        You’ll receive alerts via Slack.
                      </p>
                    </div>
                  )}
                </div> */}
                <div className="space-y-4">
                  {availableAlerts.includes("email") && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="email-notifications">
                        Email Notifications
                      </Label>
                      <Switch
                        id="email-notifications"
                        checked={notificationSettings.email}
                        onCheckedChange={(checked) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            email: checked,
                          }))
                        }
                      />
                    </div>
                  )}

                  {availableAlerts.includes("slack") && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="slack">Enable Slack Alerts</Label>
                        <Switch
                          id="slack"
                          checked={notificationSettings.slack}
                          onCheckedChange={(checked) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              slack: checked,
                            }))
                          }
                        />
                      </div>

                      {notificationSettings.slack && (
                        <div className="space-y-2 pl-6">
                          <SlackConnect />
                          <p className="text-sm text-muted-foreground">
                            You’ll receive alerts via Slack.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Notification Preferences
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="high-relevance-only">
                        High Relevance Only
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Only notify for matches with 80%+ relevance
                      </p>
                    </div>
                    <Switch
                      id="high-relevance-only"
                      checked={notificationSettings.highRelevanceOnly}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          highRelevanceOnly: checked,
                        }))
                      }
                    />
                  </div>
                  {/* 
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="daily-digest">Daily Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a daily summary instead of individual
                        notifications
                      </p>
                    </div>
                    <Switch
                      id="daily-digest"
                      checked={notificationSettings.dailyDigest}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          dailyDigest: checked,
                        }))
                      }
                    />
                  </div>

                  {notificationSettings.dailyDigest && (
                    <div className="space-y-2 pl-6">
                      <Label htmlFor="digest-time">Digest Time</Label>
                      <Input
                        id="digest-time"
                        type="time"
                        value={notificationSettings.digestTime}
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            digestTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )} */}
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
