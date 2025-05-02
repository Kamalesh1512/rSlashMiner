"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Plus,
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Send,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import ChatMessage from "../chat/chat-messages";
import { Message } from "@/lib/constants/types";
import {
  generateKeywords,
  suggestSubreddits,
  validateBusinessInput,
} from "@/actions/text-generator";
import { useFeedback } from "@/hooks/use-feedback";
import { useKeywordLimit } from "@/hooks/usage-limits/use-keyword-limit";
import { useAllowedNotifications } from "@/hooks/usage-limits/use-allowed-notifications";
import { useScheduledRuns } from "@/hooks/usage-limits/use-scheduledruns";

interface AgentCreationFormProps {
  userId: string;
}

type FormStep = "describe" | "refine" | "configure" | "review";

interface FormData {
  name: string;
  description: string;
  subreddits: string[];
  suggestedSubreddits: string[];
  keywords: string[];
  suggestedKeywords: string[];
  initialSuggestedSubreddits: string[];
  notificationMethod: "email" | "slack" | "both";
  notificationFrequency: "realtime" | "hourly" | "daily" | "weekly";
  relevanceThreshold: number;
  whatsappNumber: string;
  scheduleType: "always" | "specific";
  scheduleDays: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  scheduleTime: string;
}

export default function AgentCreationForm({ userId }: AgentCreationFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FormStep>("describe");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newSubreddit, setNewSubreddit] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [chatInput, setChatInput] = useState("");
  const { triggerAgentCreatedFeedback } = useFeedback();
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        'Describe what you want to monitor on Reddit in a single sentence. For example: "I want to track discussions about my SaaS analytics tool for customer feedback."',
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    subreddits: [],
    suggestedSubreddits: [],
    initialSuggestedSubreddits: [],
    keywords: [],
    suggestedKeywords: [],
    notificationMethod: "email",
    notificationFrequency: "daily",
    relevanceThreshold: 70,
    whatsappNumber: "",
    scheduleType: "always",
    scheduleDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    },
    scheduleTime: "09:00",
  });

  const { canAddMore, increment, decrement, remaining, loading, maxKeywords } =
    useKeywordLimit();

  const { availableAlerts, selectOptions } = useAllowedNotifications();
  const { scheduledRuns } = useScheduledRuns();
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleScheduleDayChange = (
    day: keyof FormData["scheduleDays"],
    checked: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      scheduleDays: {
        ...prev.scheduleDays,
        [day]: checked,
      },
    }));
  };

  const handleSliderChange = (value: number[]) => {
    setFormData((prev) => ({ ...prev, relevanceThreshold: value[0] }));
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) return;

    if (formData.keywords.includes(newKeyword.trim())) {
      toast.error("Duplicate keyword", {
        description: "This keyword is already in your list.",
      });
      return;
    }

    if (!canAddMore) {
      toast.error("Limit reached", {
        description: "You've reached the keyword tracking limit for your plan.",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      keywords: [...prev.keywords, newKeyword.trim()],
    }));
    increment();
    setNewKeyword("");
  };

  const removeKeyword = (keyword: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
      suggestedKeywords: [...prev.suggestedKeywords, keyword],
    }));
    decrement();
  };

  const addSuggestedKeyword = (keyword: string) => {
    if (formData.keywords.includes(keyword)) {
      toast.error("Duplicate keyword", {
        description: "This keyword is already in your list.",
      });
      return;
    }

    if (!canAddMore) {
      toast.error("Limit reached", {
        description: "You've reached the keyword tracking limit for your plan.",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      keywords: [...prev.keywords, keyword],
      suggestedKeywords: prev.suggestedKeywords.filter((k) => k !== keyword),
    }));
    increment();
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chatInput.trim()) return;

    // Add user message to chat
    setChatMessages((prev) => [...prev, { role: "user", content: chatInput }]);

    // Clear input
    setChatInput("");

    // Set loading state
    setIsGenerating(true);

    // Add thinking message
    setChatMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Analyzing your request..." },
    ]);

    try {
      //check the chat input is business related
      const response = await validateBusinessInput(chatInput);

      if (!response.isValid) {
        setChatMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content:
              "🤔 Hmm, it looks like your input doesn't seem like a business idea or problem. Try describing what you're building, the problem you're solving, or a business idea you're exploring.",
          },
        ]);
        return;
      }

      const keywordsResponse = await generateKeywords(chatInput);

      if (keywordsResponse.status !== 200 || !keywordsResponse.data) {
        setChatMessages((prev) => [
          ...prev.slice(0, -1), // remove "thinking..." message
          {
            role: "assistant",
            content:
              "⚠️ Oops! Something went wrong while analyzing your input. Please try again later.",
          },
        ]);
        return;
      }

      const suggestedKeywordList = keywordsResponse.data?.suggestedKeywords;

      // Update form data with generated values
      setFormData((prev) => ({
        ...prev,
        description: chatInput,
        suggestedKeywords: suggestedKeywordList,
      }));

      // Update chat with response
      setChatMessages((prev) => {
        // Remove the "thinking" message
        const newMessages = prev.slice(0, -1);

        // Add the response
        return [
          ...newMessages,
          {
            role: "assistant",
            content: `Great! I've analyzed your request and created an agent to monitor discussions about ${chatInput}. Here's what I've set up:
            1. **Suggested Keywords**:
            ${suggestedKeywordList}${
              suggestedKeywordList.length > 5 ? "..." : ""
            }
            Please Select from these above suggestions in the next step. Click Next!!`,
          },
        ];
      });

      // Move to next step after a short delay
      setTimeout(() => {
        setCurrentStep("refine");
      }, 1000);
    } catch (error) {
      toast.error("Error", {
        description: "Failed to process your request. Please try again.",
      });

      // Remove the "thinking" message
      setChatMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsGenerating(false);
    }
  };

  const nextStep = () => {
    if (currentStep === "describe") {
      setCurrentStep("refine");
    } else if (currentStep === "refine") {
      // if (formData.subreddits.length === 0) {
      //   toast.error("No subreddits added", {
      //     description: "Please add at least one subreddit to monitor.",
      //   });
      //   return;
      // }
      if (formData.keywords.length === 0) {
        toast.error("No keywords added", {
          description: "Please add at least one keyword to track.",
        });
        return;
      }
      if (!formData.name.trim()) {
        toast.error("Agent Name Required", {
          description: "Please add Agent Name.",
        });
        return;
      }
      setCurrentStep("configure");
    } else if (currentStep === "configure") {
      if (
        formData.notificationMethod === "slack" ||
        formData.notificationMethod === "both"
      ) {
        if (!formData.whatsappNumber) {
          toast.error("WhatsApp number required", {
            description: "Please provide a WhatsApp number for notifications.",
          });
          return;
        }
      }

      if (
        formData.scheduleType === "specific" &&
        !Object.values(formData.scheduleDays).some(Boolean)
      ) {
        toast.error("Schedule days required", {
          description: "Please select at least one day for the agent to run.",
        });
        return;
      }

      setCurrentStep("review");
    }
  };

  const prevStep = () => {
    if (currentStep === "refine") setCurrentStep("describe");
    else if (currentStep === "configure") setCurrentStep("refine");
    else if (currentStep === "review") setCurrentStep("configure");
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          name: formData.name,
          description: formData.description,
          configuration: {
            notificationMethod: formData.notificationMethod,
            notificationFrequency: formData.notificationFrequency,
            relevanceThreshold: formData.relevanceThreshold,
            whatsappNumber: formData.whatsappNumber,
            scheduleType: formData.scheduleType,
            scheduleDays: formData.scheduleDays,
            scheduleTime: formData.scheduleTime,
          },
          subreddits: formData.subreddits,
          keywords: formData.keywords,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create agent");
      }

      toast.success("Agent created", {
        description:
          "Your Reddit monitoring agent has been created successfully.",
      });

      router.push("/agents");

      triggerAgentCreatedFeedback(data.id);
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Failed to create agent",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: "describe", label: "Describe", number: 1 },
    { id: "refine", label: "Refine", number: 2 },
    { id: "configure", label: "Configure", number: 3 },
    { id: "review", label: "Review", number: 4 },
  ];

  const current = steps.find((step) => step.id === currentStep);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create Reddit Monitoring Agent</CardTitle>
        <CardDescription>
          Set up an AI agent to monitor Reddit for potential customers
          interested in your business.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-8">
          {current && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                {current.number}
              </div>
              <span className="font-medium">{current.label}</span>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {currentStep === "describe" && (
            <motion.div
              key="describe"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                <div className="space-y-4">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <ChatMessage message={message} />
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <Input
                  placeholder="Describe what you want to monitor on Reddit..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isGenerating}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={isGenerating || !chatInput.trim()}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </motion.div>
          )}

          {currentStep === "refine" && (
            <motion.div
              key="refine"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="E.g., My SaaS Product Monitor"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe your business, product, or service in detail..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <Tabs defaultValue="keywords" className="w-full">
                  <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="keywords">Keywords</TabsTrigger>
                  </TabsList>

                  <TabsContent value="keywords" className="space-y-4 mt-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter keyword or phrase"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();

                            if (canAddMore) {
                              addKeyword();
                            } else {
                              toast.error("Keyword limit reached", {
                                description:
                                  "You cannot add more keywords to your tracking list.",
                              });
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={addKeyword}
                        disabled={!newKeyword.trim() || !canAddMore}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Your Selected Keywords</Label>
                      {formData.keywords.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {formData.keywords.map((keyword) => (
                            <Badge
                              key={keyword}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {keyword}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 p-0 ml-1"
                                onClick={() => removeKeyword(keyword)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No keywords added yet.
                        </p>
                      )}
                    </div>

                    {formData.suggestedKeywords.length > 0 && (
                      <div className="space-y-2 mt-6">
                        <Label>Suggested Keywords</Label>
                        <p className="text-sm text-muted-foreground">
                          Click on a keyword to add it to your tracking list.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {formData.suggestedKeywords.map((keyword) => (
                            <Badge
                              key={keyword}
                              variant="outline"
                              className="cursor-pointer hover:bg-secondary"
                              onClick={() => {
                                if (canAddMore) {
                                  addSuggestedKeyword(keyword);
                                } else {
                                  toast.error("Keyword limit reached", {
                                    description:
                                      "You cannot add more keywords to your tracking list.",
                                  });
                                }
                              }}
                            >
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </motion.div>
          )}

          {currentStep === "configure" && (
            <motion.div
              key="configure"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Tabs defaultValue="notifications" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="notifications">
                    Notification / Schedule Settings
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="notifications" className="space-y-6 mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Notification Method</Label>
                      <Select
                        value={formData.notificationMethod}
                        onValueChange={(value) =>
                          handleSelectChange("notificationMethod", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select notification method" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {(formData.notificationMethod === "slack" ||
                      formData.notificationMethod === "both") && (
                      <div className="space-y-2">
                        <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                        <Input
                          id="whatsappNumber"
                          name="whatsappNumber"
                          placeholder="+1234567890"
                          value={formData.whatsappNumber}
                          onChange={handleInputChange}
                        />
                        <p className="text-sm text-muted-foreground">
                          Enter your WhatsApp number with country code (e.g., +1
                          for US).
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Relevance Threshold</Label>
                        <span className="text-sm">
                          {formData.relevanceThreshold}%
                        </span>
                      </div>
                      <Slider
                        value={[formData.relevanceThreshold]}
                        min={0}
                        max={100}
                        step={5}
                        onValueChange={handleSliderChange}
                      />
                      <p className="text-sm text-muted-foreground">
                        Only notify you when the AI determines the content is at
                        least this relevant to your business.
                      </p>
                    </div>
                  </div>
                  {/* <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Schedule Type</Label>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="always"
                            name="scheduleType"
                            value="always"
                            checked={formData.scheduleType === "always"}
                            onChange={() =>
                              handleSelectChange("scheduleType", "always")
                            }
                            className="h-4 w-4 text-primary"
                          />
                          <Label htmlFor="always" className="font-normal">
                            Run continuously
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="specific"
                            name="scheduleType"
                            value="specific"
                            checked={formData.scheduleType === "specific"}
                            onChange={() =>
                              handleSelectChange("scheduleType", "specific")
                            }
                            className="h-4 w-4 text-primary"
                          />
                          <Label htmlFor="specific" className="font-normal">
                            Run on specific days/times
                          </Label>
                        </div>
                      </div>
                    </div>

                    {formData.scheduleType === "specific" && (
                      <>
                        <div className="space-y-2">
                          <Label>Days to Run</Label>
                          <div className="grid grid-cols-7 gap-2">
                            {Object.entries(formData.scheduleDays).map(
                              ([day, isEnabled]) => (
                                <div
                                  key={day}
                                  className="flex flex-col items-center"
                                >
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
                                      handleScheduleDayChange(
                                        day as keyof FormData["scheduleDays"],
                                        checked
                                      )
                                    }
                                  />
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="scheduleTime">Time to Run</Label>
                          <Input
                            id="scheduleTime"
                            name="scheduleTime"
                            type="time"
                            value={formData.scheduleTime}
                            onChange={handleInputChange}
                          />
                          <p className="text-sm text-muted-foreground">
                            The agent will run at this time on the selected
                            days.
                          </p>
                        </div>
                      </>
                    )}
                  </div> */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Scheduling</Label>
                      {!scheduledRuns.enabled ? (
                        <div className="p-4 border rounded-md bg-muted text-muted-foreground text-sm">
                          Scheduling Agent Run is not available on your current plan.
                        </div>
                      ) : (
                        <>
                          <div className="text-sm text-muted-foreground border p-3 rounded-md bg-muted">
                            Scheduled runs are available every{" "}
                            <strong>{scheduledRuns.interval}</strong> based on
                            your <strong>{scheduledRuns.type}</strong> plan.
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="startTime">Start Time</Label>
                            <Input
                              id="startTime"
                              name="startTime"
                              type="time"
                              value={formData.scheduleTime}
                              onChange={handleInputChange}
                              disabled={!scheduledRuns.enabled}
                            />
                            <p className="text-sm text-muted-foreground">
                              The agent will start at this time every{" "}
                              {scheduledRuns.interval}.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}

          {currentStep === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Review Your Agent Configuration
                </h3>
                <p className="text-muted-foreground">
                  Please review the details below before creating your Reddit
                  monitoring agent.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">Business Details</h4>
                      <div className="mt-2 space-y-2">
                        <div>
                          <span className="text-sm font-medium">Name:</span>{" "}
                          <span className="text-sm">{formData.name}</span>
                        </div>
                        {/* <div>
                          <span className="text-sm font-medium">Industry:</span>{" "}
                          <span className="text-sm">{formData.industry}</span>
                        </div> */}
                        <div>
                          <span className="text-sm font-medium">
                            Description:
                          </span>{" "}
                          <p className="text-sm mt-1">{formData.description}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Keywords to Track</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.keywords.map((keyword) => (
                          <Badge key={keyword} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">
                        Notification Settings
                      </h4>
                      <div className="mt-2 space-y-2">
                        <div>
                          <span className="text-sm font-medium">Method:</span>{" "}
                          <span className="text-sm">
                            {formData.notificationMethod === "email"
                              ? "Email Only"
                              : formData.notificationMethod === "slack"
                              ? "Slack Only"
                              : "Email and Slack"}
                          </span>
                        </div>
                        {(formData.notificationMethod === "slack" ||
                          formData.notificationMethod === "both") && (
                          <div>
                            <span className="text-sm font-medium">
                              WhatsApp Number:
                            </span>{" "}
                            <span className="text-sm">
                              {formData.whatsappNumber}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-medium">
                            Relevance Threshold:
                          </span>{" "}
                          <span className="text-sm">
                            {formData.relevanceThreshold}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Schedule Settings</h4>
                      <div className="mt-2 space-y-2">
                        {!scheduledRuns.enabled ? (
                          <div className="p-4 border rounded-md bg-muted text-muted-foreground text-sm">
                            Scheduling Agent Run is not available on your current plan.
                          </div>
                        ) : (
                          <>
                            <div>
                              <span className="text-sm font-medium">Plan:</span>{" "}
                              <span className="text-sm capitalize">
                                {scheduledRuns.type}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm font-medium">
                                Interval:
                              </span>{" "}
                              <span className="text-sm capitalize">
                                Every {scheduledRuns.interval}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm font-medium">
                                Start Time:
                              </span>{" "}
                              <span className="text-sm">
                                {formData.scheduleTime}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      <CardFooter className="flex justify-between">
        {currentStep !== "describe" ? (
          <Button type="button" variant="outline" onClick={prevStep}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/agents")}
          >
            Cancel
          </Button>
        )}

        {currentStep !== "review" ? (
          <Button type="button" onClick={nextStep}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Create Agent
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
