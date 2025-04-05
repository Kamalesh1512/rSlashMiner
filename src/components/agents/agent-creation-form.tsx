"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, X, ArrowLeft, ArrowRight, Check } from "lucide-react";
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
import { toast } from "sonner";
import { generateKeywords, suggestSubreddits } from "@/actions/text-generator";

interface AgentCreationFormProps {
  userId: string;
}

type FormStep =
  | "business"
  | "subreddits"
  | "keywords"
  | "notifications"
  | "review";

interface FormData {
  name: string;
  description: string;
  industry: string;
  subreddits: string[];
  suggestedSubreddits: string[];
  keywords: string[];
  suggestedKeywords: string[];
  notificationMethod: "email" | "whatsapp" | "both";
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
  const [currentStep, setCurrentStep] = useState<FormStep>("business");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newSubreddit, setNewSubreddit] = useState("");
  const [newKeyword, setNewKeyword] = useState("");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    industry: "",
    subreddits: [],
    suggestedSubreddits: [],
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

  const addSubreddit = () => {
    if (!newSubreddit.trim()) return;

    // Remove 'r/' prefix if present
    const formattedSubreddit = newSubreddit.trim().replace(/^r\//, "");

    if (formData.subreddits.includes(formattedSubreddit)) {
      toast.error("Duplicate subreddit", {
        description: "This subreddit is already in your list.",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      subreddits: [...prev.subreddits, formattedSubreddit],
    }));
    setNewSubreddit("");
  };

  const removeSubreddit = (subreddit: string) => {
    setFormData((prev) => ({
      ...prev,
      subreddits: prev.subreddits.filter((s: string) => s !== subreddit),
    }));
  };

  const addSuggestedSubreddit = (subreddit: string) => {
    if (formData.subreddits.includes(subreddit)) {
      toast.error("Duplicate subreddit", {
        description: "This subreddit is already in your list.",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      subreddits: [...prev.subreddits, subreddit],
      suggestedSubreddits: prev.suggestedSubreddits.filter(
        (s: string) => s !== subreddit
      ),
    }));
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) return;

    if (formData.keywords.includes(newKeyword.trim())) {
      toast("Duplicate keyword", {
        description: "This keyword is already in your list.",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      keywords: [...prev.keywords, newKeyword.trim()],
    }));
    setNewKeyword("");
  };

  const removeKeyword = (keyword: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k: string) => k !== keyword),
    }));
  };

  const addSuggestedKeyword = (keyword: string) => {
    if (formData.keywords.includes(keyword)) {
      toast("Duplicate keyword", {
        description: "This keyword is already in your list.",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      keywords: [...prev.keywords, keyword],
      suggestedKeywords: prev.suggestedKeywords.filter(
        (k: string) => k !== keyword
      ),
    }));
  };

  const generateSuggestions = async () => {
    if (!formData.description || !formData.industry) {
      toast.error("Missing information", {
        description:
          "Please provide a business description and industry to generate suggestions.",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Generate keywords
      const keywordsResult = await generateKeywords(
        formData.description,
        formData.industry
      );

      // Generate subreddits
      const subredditsResult = await suggestSubreddits(
        formData.description,
        formData.industry
      );

      if (keywordsResult.status <= 201 && subredditsResult.status <= 201) {
        const keywords = keywordsResult.data as string[];
        const subreddits = subredditsResult.data as string[];
        setFormData((prev) => ({
          ...prev,
          suggestedKeywords: keywords.filter(
            (k: string) => !prev.keywords.includes(k)
          ),
          suggestedSubreddits: subreddits.filter(
            (s: string) => !prev.subreddits.includes(s)
          ),
        }));

        toast.success("Suggestions generated", {
          description:
            "We've generated keyword and subreddit suggestions based on your business details.",
        });
      }
    } catch (error) {
      toast.error("Generation failed", {
        description: "Failed to generate suggestions. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const nextStep = () => {
    if (currentStep === "business") {
      if (!formData.name || !formData.description || !formData.industry) {
        toast.error("Missing information", {
          description: "Please fill in all required fields.",
        });
        return;
      }
      setCurrentStep("subreddits");
    } else if (currentStep === "subreddits") {
      if (formData.subreddits.length === 0) {
        toast.error("No subreddits added", {
          description: "Please add at least one subreddit to monitor.",
        });
        return;
      }
      setCurrentStep("keywords");
    } else if (currentStep === "keywords") {
      if (formData.keywords.length === 0) {
        toast.error("No keywords added", {
          description: "Please add at least one keyword to track.",
        });
        return;
      }
      setCurrentStep("notifications");
    } else if (currentStep === "notifications") {
      if (
        formData.notificationMethod === "whatsapp" ||
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
        toast("Schedule days required", {
          description: "Please select at least one day for the agent to run.",
        });
        return;
      }

      setCurrentStep("review");
    }
  };

  const prevStep = () => {
    if (currentStep === "subreddits") setCurrentStep("business");
    else if (currentStep === "keywords") setCurrentStep("subreddits");
    else if (currentStep === "notifications") setCurrentStep("keywords");
    else if (currentStep === "review") setCurrentStep("notifications");
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
            industry: formData.industry,
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
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Failed to create agent",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="flex justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === "business" ||
                  currentStep === "subreddits" ||
                  currentStep === "keywords" ||
                  currentStep === "notifications" ||
                  currentStep === "review"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                1
              </div>
              <span
                className={
                  currentStep === "business"
                    ? "font-medium"
                    : "text-muted-foreground"
                }
              >
                Business
              </span>
            </div>
            <div className="h-[2px] flex-1 bg-border self-center mx-2"></div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === "subreddits" ||
                  currentStep === "keywords" ||
                  currentStep === "notifications" ||
                  currentStep === "review"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
              <span
                className={
                  currentStep === "subreddits"
                    ? "font-medium"
                    : "text-muted-foreground"
                }
              >
                Subreddits
              </span>
            </div>
            <div className="h-[2px] flex-1 bg-border self-center mx-2"></div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === "keywords" ||
                  currentStep === "notifications" ||
                  currentStep === "review"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                3
              </div>
              <span
                className={
                  currentStep === "keywords"
                    ? "font-medium"
                    : "text-muted-foreground"
                }
              >
                Keywords
              </span>
            </div>
            <div className="h-[2px] flex-1 bg-border self-center mx-2"></div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === "notifications" || currentStep === "review"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                4
              </div>
              <span
                className={
                  currentStep === "notifications"
                    ? "font-medium"
                    : "text-muted-foreground"
                }
              >
                Notifications
              </span>
            </div>
            <div className="h-[2px] flex-1 bg-border self-center mx-2"></div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === "review"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                5
              </div>
              <span
                className={
                  currentStep === "review"
                    ? "font-medium"
                    : "text-muted-foreground"
                }
              >
                Review
              </span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === "business" && (
            <motion.div
              key="business"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="E.g., My SaaS Product Monitor"
                  value={formData.name}
                  onChange={handleInputChange}
                />
                <p className="text-sm text-muted-foreground">
                  Give your agent a descriptive name to help you identify it
                  later.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Business Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) =>
                    handleSelectChange("industry", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">
                      Technology & SaaS
                    </SelectItem>
                    <SelectItem value="ecommerce">
                      E-commerce & Retail
                    </SelectItem>
                    <SelectItem value="finance">Finance & Fintech</SelectItem>
                    <SelectItem value="health">Health & Wellness</SelectItem>
                    <SelectItem value="education">
                      Education & E-learning
                    </SelectItem>
                    <SelectItem value="marketing">
                      Marketing & Advertising
                    </SelectItem>
                    <SelectItem value="food">Food & Beverage</SelectItem>
                    <SelectItem value="travel">Travel & Hospitality</SelectItem>
                    <SelectItem value="entertainment">
                      Entertainment & Media
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your business, product, or service in detail..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                />
                <p className="text-sm text-muted-foreground">
                  Provide a detailed description of your business, including
                  what problems it solves, target audience, and unique selling
                  points. This helps our AI generate better keyword and
                  subreddit suggestions.
                </p>
              </div>
            </motion.div>
          )}

          {currentStep === "subreddits" && (
            <motion.div
              key="subreddits"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Subreddits to Monitor</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateSuggestions}
                  disabled={
                    isGenerating || !formData.description || !formData.industry
                  }
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>Generate Suggestions</>
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter subreddit name (without r/)"
                    value={newSubreddit}
                    onChange={(e) => setNewSubreddit(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSubreddit();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addSubreddit}
                    disabled={!newSubreddit.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Your Selected Subreddits</Label>
                  {formData.subreddits.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.subreddits.map((subreddit) => (
                        <Badge
                          key={subreddit}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          r/{subreddit}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => removeSubreddit(subreddit)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No subreddits added yet.
                    </p>
                  )}
                </div>

                {formData.suggestedSubreddits.length > 0 && (
                  <div className="space-y-2 mt-6">
                    <Label>Suggested Subreddits</Label>
                    <p className="text-sm text-muted-foreground">
                      Click on a subreddit to add it to your monitoring list.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.suggestedSubreddits.map((subreddit) => (
                        <Badge
                          key={subreddit}
                          variant="outline"
                          className="cursor-pointer hover:bg-secondary"
                          onClick={() => addSuggestedSubreddit(subreddit)}
                        >
                          r/{subreddit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentStep === "keywords" && (
            <motion.div
              key="keywords"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Keywords to Track</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateSuggestions}
                  disabled={
                    isGenerating || !formData.description || !formData.industry
                  }
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>Generate Suggestions</>
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter keyword or phrase"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addKeyword();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addKeyword}
                    disabled={!newKeyword.trim()}
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
                          onClick={() => addSuggestedKeyword(keyword)}
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentStep === "notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Tabs defaultValue="notifications" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="notifications">
                    Notification Settings
                  </TabsTrigger>
                  <TabsTrigger value="schedule">Schedule Settings</TabsTrigger>
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
                          <SelectItem value="email">Email Only</SelectItem>
                          <SelectItem value="whatsapp">
                            WhatsApp Only
                          </SelectItem>
                          <SelectItem value="both">
                            Both Email and WhatsApp
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(formData.notificationMethod === "whatsapp" ||
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
                      <Label>Notification Frequency</Label>
                      <Select
                        value={formData.notificationFrequency}
                        onValueChange={(value) =>
                          handleSelectChange("notificationFrequency", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="realtime">
                            Real-time (As Found)
                          </SelectItem>
                          <SelectItem value="hourly">Hourly Digest</SelectItem>
                          <SelectItem value="daily">Daily Digest</SelectItem>
                          <SelectItem value="weekly">Weekly Digest</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        How often you want to receive notifications about
                        potential matches.
                      </p>
                    </div>

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
                </TabsContent>

                <TabsContent value="schedule" className="space-y-6 mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Schedule Type</Label>
                      <div className="flex items-center space-x-4">
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
                        <div>
                          <span className="text-sm font-medium">Industry:</span>{" "}
                          <span className="text-sm">{formData.industry}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">
                            Description:
                          </span>{" "}
                          <p className="text-sm mt-1">{formData.description}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium">
                        Subreddits to Monitor
                      </h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.subreddits.map((subreddit) => (
                          <Badge key={subreddit} variant="secondary">
                            r/{subreddit}
                          </Badge>
                        ))}
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
                              : formData.notificationMethod === "whatsapp"
                              ? "WhatsApp Only"
                              : "Email and WhatsApp"}
                          </span>
                        </div>
                        {(formData.notificationMethod === "whatsapp" ||
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
                            Frequency:
                          </span>{" "}
                          <span className="text-sm">
                            {formData.notificationFrequency === "realtime"
                              ? "Real-time (As Found)"
                              : formData.notificationFrequency === "hourly"
                              ? "Hourly Digest"
                              : formData.notificationFrequency === "daily"
                              ? "Daily Digest"
                              : "Weekly Digest"}
                          </span>
                        </div>
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
                        <div>
                          <span className="text-sm font-medium">Type:</span>{" "}
                          <span className="text-sm">
                            {formData.scheduleType === "always"
                              ? "Run continuously"
                              : "Run on specific days/times"}
                          </span>
                        </div>
                        {formData.scheduleType === "specific" && (
                          <>
                            <div>
                              <span className="text-sm font-medium">Days:</span>{" "}
                              <span className="text-sm">
                                {Object.entries(formData.scheduleDays)
                                  .filter(([_, isEnabled]) => isEnabled)
                                  .map(
                                    ([day]) =>
                                      day.charAt(0).toUpperCase() + day.slice(1)
                                  )
                                  .join(", ")}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Time:</span>{" "}
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
        {currentStep !== "business" ? (
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
