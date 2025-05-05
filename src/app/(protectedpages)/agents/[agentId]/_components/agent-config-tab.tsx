"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
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

export function AgentConfigTab({ agent, subscription }: AgentConfigTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [originalForm, setOriginalForm] = useState({ ...agent.configuration });
  const [form, setForm] = useState({ ...agent.configuration });
  const [isActive, setIsActive] = useState(agent.isActive);
  const { agents, setAgents } = useAgentStore();
  const [isSaving, setIsSaving] = useState(false);

  const { scheduledRuns } = useScheduledRuns();
  const { availableAlerts, selectOptions } = useAllowedNotifications();

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Basic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Configuration</CardTitle>
            <CardDescription>General settings for this agent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Relevance Threshold</Label>
              {isEditing ? (
                <>
                  <Slider
                    value={[form.relevanceThreshold]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(e) =>
                      handleChange("relevanceThreshold", Number(e[0]))
                    }
                  />
                  <span className="text-sm">{form.relevanceThreshold}%</span>
                </>
              ) : (
                <>
                  <p>{form.relevanceThreshold}%</p>
                  <p className="text-sm text-muted-foreground">
                    Only notify you when the AI determines the content is at
                    least this relevant to your business.
                  </p>
                </>
              )}
            </div>

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
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              How you'll be notified about new matches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <div className="mt-3 flex flex-col items-start justify-between gap-2">
                  <Label htmlFor="SlackNotification">Slack Notification</Label>
                  <SlackConnect />
                  <p className="text-sm text-muted-foreground">
                    You’ll receive alerts via Slack.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Settings */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Schedule Settings</CardTitle>
            <CardDescription>
              When this agent runs to check for new content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Schedule Type</Label>
              {isEditing ? (
                <>
                  <Select
                    value={form.scheduleType}
                    onValueChange={(val) => handleChange("scheduleType", val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">Run Continuously</SelectItem>
                      <SelectItem value="specific">Run on Schedule</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <p>
                  {form.scheduleType === "always"
                    ? "Run continuously (as allowed by your subscription)"
                    : "Run on specific days/times"}
                </p>
              )}
            </div>

            {form.scheduleType === "specific" && (
              <>
                <div>
                  <Label>Days</Label>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(form.scheduleDays ?? {}).map(
                        ([day, isEnabled]) => (
                          <div key={day} className="flex flex-col items-center">
                            <Label
                              htmlFor={day}
                              className="mb-1 text-xs uppercase"
                            >
                              {day.slice(0, 3)}
                            </Label>
                            <Switch
                              id={day}
                              checked={isEnabled}
                              onCheckedChange={(checked) =>
                                setForm((prev) => ({
                                  ...prev,
                                  scheduleDays: {
                                    monday: false,
                                    tuesday: false,
                                    wednesday: false,
                                    thursday: false,
                                    friday: false,
                                    saturday: false,
                                    sunday: false,
                                    ...prev.scheduleDays,
                                    [day as keyof typeof prev.scheduleDays]:
                                      checked,
                                  },
                                }))
                              }
                            />
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {form.scheduleDays &&
                        Object.entries(form.scheduleDays)
                          .filter(([_, isEnabled]) => isEnabled)
                          .map(([day]) => (
                            <Badge key={day} variant="outline">
                              {day.charAt(0).toUpperCase() + day.slice(1)}
                            </Badge>
                          ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Time</Label>
                  {isEditing ? (
                    <Input
                      type="time"
                      value={form.scheduleTime}
                      onChange={(e) =>
                        handleChange("scheduleTime", e.target.value)
                      }
                    />
                  ) : (
                    <p>{form.scheduleTime}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card> */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Settings</CardTitle>
            <CardDescription>
              Configure when this agent should start running.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!scheduledRuns.enabled ? (
              <div className="p-4 border rounded-md bg-muted text-muted-foreground text-sm">
                Scheduling Agent Run is not available on your current plan.
              </div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground border p-3 rounded-md bg-muted">
                  This agent is scheduled to run every{" "}
                  <strong>{scheduledRuns.interval}</strong>
                  based on your <strong>{scheduledRuns.type}</strong> plan.
                </div>

                <div>
                  <Label htmlFor="scheduleTime">Start Time</Label>
                  {isEditing ? (
                    <Input
                      id="scheduleTime"
                      type="time"
                      value={form.scheduleTime}
                      onChange={(e) =>
                        handleChange("scheduleTime", e.target.value)
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {form.scheduleTime}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    The agent will start at this time every{" "}
                    {scheduledRuns.interval}.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              Destructive actions for this agent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isFree ? (
              <span className="text-sm text-muted-foreground">
                Free Tier Do not have option to delete agent
              </span>
            ) : (
              <></>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={isFree}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Agent
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the agent "{agent.name}" and all of its monitoring history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      handleDeleteAgent();
                    }}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
