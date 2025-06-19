"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Agent,
  SubscriptionstatusProps,
  weekDays,
} from "@/lib/constants/types";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAgentStore } from "@/store/agentstore";
import { useScheduledRuns } from "@/hooks/usage-limits/use-scheduledruns";
import { useAllowedNotifications } from "@/hooks/usage-limits/use-allowed-notifications";
import { SlackConnect } from "@/components/slack/slack-connect";

interface AgentConfigTabProps {
  agent: Agent;
  subscription: string;
}
type ScheduledRuns = {
  enabled: boolean;
  interval: string | null;
  type: string;
};

export function AgentConfigTab({ agent, subscription }: AgentConfigTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [originalForm, setOriginalForm] = useState({ ...agent.configuration });
  const [form, setForm] = useState({ ...agent.configuration });
  const [isActive, setIsActive] = useState(agent.isActive);
  const { agents, setAgents } = useAgentStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const { availableAlerts, selectOptions } = useAllowedNotifications();

  const { scheduledRuns, loading } = useScheduledRuns();

  useEffect(() => {
    if (!loading && form.scheduleRuns.enabled) {
      setIsScheduled(scheduledRuns.enabled);
    }
  }, [scheduledRuns, agent]);

  const router = useRouter();

  const isFree = subscription === "free";

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/agents/${agent.id}/update-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configuration: form,
          isActive,
          agentId: agent.id,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        toast.success("Settings saved successfully");

        // ✅ Update agent in store
        const updatedAgent = {
          ...agent,
          configuration: form,
          isActive,
          updatedAt: new Date(),
        };

        const updatedAgents = agents.map((a) =>
          a.id === agent.id ? updatedAgent : a
        );

        setAgents(updatedAgents);
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save settings");
      }
    } catch (err) {
      toast.error("Something went wrong while saving settings");
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => setIsEditing((prev) => !prev);

  const toggleAgentStatus = (checked: boolean) => {
    setIsActive(checked);
  };

  const toggleScheduledStatus = (checked: boolean) => {
    setIsScheduled(checked);
    setForm((prev) => ({
      ...prev,
      scheduleRuns: { ...prev.scheduleRuns, enabled: checked },
    }));
  };

  const handleCancel = () => {
    setForm(originalForm);
    setIsEditing(false);
  };

  const handleDeleteAgent = async () => {
    try {
      const response = await fetch(`/api/agents/${agent.id}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent.id,
        }),
      });
      console.log("Delete API Response", response);
      if (response.ok) {
        const updatedAgents = agents.filter((res) => res.id !== agent.id);
        setAgents(updatedAgents);
        toast.success("Settings saved successfully");
        router.push("/agents");
      }
    } catch (error) {
      toast.error("Something went wrong while Deleting agent");
      console.error("Delete error:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4 gap-2">
        {isEditing ? (
          <>
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </>
        ) : (
          <Button onClick={toggleEdit}>Edit Settings</Button>
        )}
      </div>
      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>Agent Configuration</CardTitle>
            <CardDescription>
              Manage Agent settings
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Agent Status */}
            <div className="flex items-center justify-between">
              <Label>Agent Status</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="agent-status">
                  {isActive ? "Active" : "Paused"}
                </Label>
                <Switch
                  id="agent-status"
                  checked={isActive}
                  onCheckedChange={toggleAgentStatus}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Notification Settings */}
            <div>
              <Label>Notification Method</Label>
              {isEditing ? (
                <Select
                  value={form.notificationMethod}
                  onValueChange={(val) =>
                    handleChange("notificationMethod", val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p>
                  {form.notificationMethod === "email" && "Email Only"}
                  {form.notificationMethod === "slack" && "Slack Only"}
                  {form.notificationMethod === "both" && "Email and Slack"}
                </p>
              )}

              {(form.notificationMethod === "slack" ||
                form.notificationMethod === "both") && (
                <div className="mt-3 flex flex-col items-start gap-2">
                  <Label htmlFor="SlackNotification">Slack Notification</Label>
                  <SlackConnect />
                  <p className="text-sm text-muted-foreground">
                    You’ll receive alerts via Slack.
                  </p>
                </div>
              )}
            </div>

            {/* Schedule Settings */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Scheduled Run</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="schedule-status">
                    {isScheduled ? "On" : "Off"}
                  </Label>
                  <Switch
                    id="schedule-status"
                    checked={isScheduled}
                    onCheckedChange={toggleScheduledStatus}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {!scheduledRuns.enabled ? (
                <div className="p-4 border rounded-md bg-muted text-muted-foreground text-sm">
                  Scheduling Agent Run is not available on your current plan.
                </div>
              ) : isScheduled ? (
                <>
                  <div className="text-sm text-muted-foreground border p-3 rounded-md bg-muted">
                    This agent is scheduled to run every{" "}
                    <strong className="mr-1">{scheduledRuns.interval}</strong>{" "}
                    based on your plan.
                  </div>
                  <div className="mt-2">
                    <Label htmlFor="scheduleTime">Start Time</Label>
                    {isEditing ? (
                      <Input
                        id="scheduleTime"
                        type="time"
                        value={form.scheduleRuns.scheduleTime}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            scheduleRuns: {
                              ...prev.scheduleRuns,
                              scheduleTime: e.target.value,
                            },
                          }))
                        }
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {form.scheduleRuns.scheduleTime}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      The agent auto-run will start at this time and repeats every{" "}
                      {scheduledRuns.interval}.
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-4 border rounded-md bg-muted text-muted-foreground text-sm">
                  Scheduling Agent Run is Off.
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div>
              <Label className="text-destructive">Danger Zone</Label>
              <div className="mt-2 space-y-2">
                {isFree ? (
                  <p className="text-sm text-muted-foreground">
                    Free Tier does not allow agent deletion.
                  </p>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full sm:w-auto"
                        disabled={isFree}
                      >
                        <Trash2 className="mr-2 h-4 w-full lg:w-fit" />
                        Delete Agent
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the agent "{agent.name}" and results associated to it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAgent}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
