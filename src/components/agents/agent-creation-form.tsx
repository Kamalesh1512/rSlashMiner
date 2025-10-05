// Agent creation front end - client side
"use client";
import React from "react";
import { useState, useRef, useEffect } from "react";
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
  Globe,
  MessageSquare,
  Users,
  Briefcase,
  Hash,
  Settings,
  Bell,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Info,
  ExternalLink,
  Save,
  BellRing,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Agent, planLimits } from "@/lib/constants/types";
import Image from "next/image";
import { SlackConnect } from "../slack/slack-connect";

interface AgentFormProps {
  userId: string;
  mode: "create" | "edit";
  agent?: Agent; // Required when mode is 'edit'
  onClose?: () => void;
  onSuccess?: (agentId: string) => void;
}

// Platform configuration interfaces
interface PlatformConfig {
  reddit?: {
    subreddits: string[];
    searchPosts: boolean;
    searchComments: boolean;
    includeNSFW: boolean;
    minScore: number;
  };
  x?: {
    searchTweets: boolean;
    searchReplies: boolean;
    minEngagement: number;
  };
  linkedin?: {
    searchPosts: boolean;
    searchArticles: boolean;
    companies: string[];
  };
  bluesky?: {
    searchPosts: boolean;
    searchReplies: boolean;
  };
}

interface FormData {
  name: string;
  keywords: string[];
  excludedKeywords: string[];
  platforms: {
    reddit: boolean;
    bluesky: boolean;
    linkedin: boolean;
    x: boolean;
    hackernews: boolean;
  };
  redditSettings: {
    includedSubreddits: string[];
    excludedSubreddits: string[];
    searchPosts: boolean;
    searchComments: boolean;
    includeNSFW: boolean;
  };
  notificationFrequency: string;
  notificationsEnabled?: boolean;
  notificationChannels?: {
    email: boolean;
    slack: boolean;
  };
  slackConnected?: boolean;
  color: string;
}

// Platform options with icons and descriptions
const PLATFORM_OPTIONS = [
  {
    id: "reddit",
    name: "Reddit",
    logo: "/platform_logos/redditIcon.png",
    description: "Monitor subreddits for discussions and questions",
    color: "bg-red-50 border-red-200 text-red-800",
  },
  {
    id: "x",
    name: "Twitter/X",
    logo: "/platform_logos/twitter.png",
    description: "Track tweets and conversations",
    color: "bg-blue-50 border-blue-200 text-blue-800",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    logo: "/platform_logos/linkedin.png",
    description: "Find professional discussions and opportunities",
    color: "bg-indigo-50 border-indigo-200 text-indigo-800",
  },
  {
    id: "bluesky",
    name: "Bluesky",
    logo: "/platform_logos/BlueskyIcon.png",
    description: "Monitor emerging social conversations",
    color: "bg-sky-50 border-sky-200 text-sky-800",
  },
];

const COLOR_OPTIONS = [
  { name: "Mystic Amethyst", value: "purple" },
  { name: "Deep Sea Horizon", value: "blue" },
  { name: "Emerald Grove", value: "green" },
  { name: "Solar Ember", value: "orange" },
  { name: "Crimson Blaze", value: "red" },
  { name: "Lunar Frost", value: "grey" },
  { name: "Aurora Glow", value: "teal" },
  { name: "Neon Pulse", value: "pink" },
  { name: "Celestial Gold", value: "amber" },
];

// Helper function to convert platforms array to platforms object
const platformsArrayToObject = (platformsArray: string[]) => {
  return {
    reddit: platformsArray.includes("reddit"),
    bluesky: platformsArray.includes("bluesky"),
    linkedin: platformsArray.includes("linkedin"),
    x: platformsArray.includes("x"),
    hackernews: platformsArray.includes("hackernews"),
  };
};

// Helper function to get initial form data
const getInitialFormData = (
  mode: "create" | "edit",
  agent?: Agent
): FormData => {
  if (mode === "edit" && agent) {
    return {
      name: agent.name,
      keywords: agent.keywords,
      excludedKeywords: agent.excludedKeywords || [],
      platforms: platformsArrayToObject(agent.platforms),
      redditSettings: {
        includedSubreddits:
          agent.platformConfigs?.reddit?.config?.subreddits || [],
        excludedSubreddits:
          agent.platformConfigs?.reddit?.config?.excludedSubreddits || [],
        searchPosts: agent.platformConfigs?.reddit?.config?.searchPosts ?? true,
        searchComments:
          agent.platformConfigs?.reddit?.config?.searchComments ?? true,
        includeNSFW:
          agent.platformConfigs?.reddit?.config?.includeNSFW ?? false,
      },
      // Notifications
      notificationsEnabled: agent.notificationsEnabled ?? true,
      notificationChannels: {
        email: agent.notificationChannels?.email ?? true,
        slack: agent.notificationChannels?.slack ?? false,
      },
      slackConnected: false,
      notificationFrequency: agent.notificationFrequency ?? "daily",
      color: agent.color || '',
    };
  }

  // Default form data for create mode
  return {
    name: "",
    keywords: [],
    excludedKeywords: [],
    platforms: {
      reddit: false,
      bluesky: false,
      linkedin: false,
      x: false,
      hackernews: false,
    },
    redditSettings: {
      includedSubreddits: [],
      excludedSubreddits: [],
      searchPosts: true,
      searchComments: true,
      includeNSFW: false,
    },
    notificationsEnabled: false,
    notificationChannels: {
      email: false,
      slack: false,
    },
    slackConnected: false,
    notificationFrequency: "daily",
    color: "purple",
  };
};

export default function AgentForm({
  userId,
  mode,
  agent,
  onClose,
  onSuccess,
}: AgentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<any>(planLimits.free);
  const [currentAgentCount, setCurrentAgentCount] = useState(0);
  const [currentKeywordCount, setCurrentKeywordCount] = useState(0);
  const [currentMonthlyLeadsUsed, setCurrentMonthlyLeadsUsed] = useState(0);
  const [redditSettingsOpen, setRedditSettingsOpen] = useState(false);

  const [planStatus, setPlanStatus] = useState<{
    loading: boolean;
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>({ loading: true, valid: false, errors: [], warnings: [] });

  const [formData, setFormData] = useState<FormData>(() =>
    getInitialFormData(mode, agent)
  );

  // Validation for edit mode should exclude current agent from limits
  const isEditMode = mode === "edit";
  const currentAgentKeywordCount =
    isEditMode && agent ? agent.keywords.length : 0;

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function runValidation() {
      // map platforms object to string[]
      const selectedPlatforms = Object.entries(formData.platforms)
        .filter(([_, v]) => v)
        .map(([k]) => k);

      try {
        const payload = {
          name: formData.name ?? "",
          keywords: Array.isArray(formData.keywords) ? formData.keywords : [],
          platforms: Array.isArray(selectedPlatforms) ? selectedPlatforms : [],
          notificationFrequency: formData.notificationFrequency ?? "daily",
          isEdit: Boolean(isEditMode),
          agentId: agent?.id ?? null,
        };
        const res = await fetch("/api/usage-limits/validate-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!mounted) return;
        if (!res.ok) {
          setPlanStatus({
            loading: false,
            valid: false,
            errors: ["Validation failed"],
            warnings: [],
          });
          return;
        }
        const data = await res.json();
        setPlanStatus({
          loading: false,
          valid: !!data.isValid,
          errors: data.errors || [],
          warnings: data.warnings || [],
        });
      } catch (err) {
        if (!mounted) return;
        console.error(err);
        setPlanStatus({
          loading: false,
          valid: false,
          errors: ["Unable to validate plan. Try again."],
          warnings: [],
        });
      }
    }

    // Debounce a little to avoid many calls when user types
    const id = setTimeout(() => runValidation(), 350);
    return () => {
      mounted = false;
      controller.abort();
      clearTimeout(id);
    };
  }, [
    formData.name,
    formData.keywords,
    JSON.stringify(formData.platforms),
    formData.notificationFrequency,
    isEditMode,
    agent?.id,
  ]);

  const [tempInputs, setTempInputs] = useState({
    keyword: "",
    excludedKeyword: "",
    includedAuthor: "",
    excludedAuthor: "",
    includedSubreddit: "",
    excludedSubreddit: "",
  });

  const canCreateAgent = () => isEditMode || currentAgentCount < userPlan.agent;
  const canAddKeyword = () => {
    const maxKeywords = userPlan.keywords;
    const currentUsed = isEditMode
      ? formData.keywords.length
      : formData.keywords.length;
    return currentUsed < maxKeywords;
  };
  const hasMonthlyLeadsLeft = () =>
    currentMonthlyLeadsUsed < userPlan.monthlyLeads;

  const addItem = (type: keyof typeof tempInputs, arrayKey: keyof FormData) => {
    const value = tempInputs[type].trim();
    if (!value) return;

    if (type === "keyword" && !canAddKeyword()) {
      toast.error("Keyword limit reached", {
        description: `Your plan allows only ${userPlan.keywords} keywords per agent.`,
      });
      return;
    }

    const currentArray = formData[arrayKey] as string[];
    if (currentArray.includes(value)) {
      toast.error("Already added", {
        description: `"${value}" is already in the list.`,
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [arrayKey]: [...currentArray, value],
    }));

    setTempInputs((prev) => ({
      ...prev,
      [type]: "",
    }));
  };

  const removeItem = (arrayKey: keyof FormData, item: string) => {
    const currentArray = formData[arrayKey] as string[];
    setFormData((prev) => ({
      ...prev,
      [arrayKey]: currentArray.filter((i) => i !== item),
    }));
  };

  const handlePlatformChange = (
    platform: keyof FormData["platforms"],
    checked: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: checked,
      },
    }));
  };

  const handleRedditSettingChange = (
    setting: keyof FormData["redditSettings"],
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      redditSettings: {
        ...prev.redditSettings,
        [setting]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error("Agent name is required");
      return;
    }

    if (formData.keywords.length === 0) {
      toast.error("At least one keyword is required");
      return;
    }

    if (!Object.values(formData.platforms).some(Boolean)) {
      toast.error("At least one platform must be selected");
      return;
    }

    if (!isEditMode && !canCreateAgent()) {
      toast.error("Agent limit reached", {
        description: `Your plan allows only ${userPlan.agent} agents.`,
      });
      return;
    }

    if (!hasMonthlyLeadsLeft()) {
      toast.error("Monthly lead limit reached", {
        description: "Upgrade your plan to track more leads this month.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data for API
      const selectedPlatforms = Object.entries(formData.platforms)
        .filter(([_, enabled]) => enabled)
        .map(([platform, _]) => platform);

      const platformConfigs: any = {};

      // Add Reddit config if selected
      if (formData.platforms.reddit) {
        platformConfigs.reddit = {
          subreddits: formData.redditSettings.includedSubreddits,
          excludedSubreddits: formData.redditSettings.excludedSubreddits,
          searchPosts: formData.redditSettings.searchPosts,
          searchComments: formData.redditSettings.searchComments,
          includeNSFW: formData.redditSettings.includeNSFW,
          minScore: 1,
        };
      }

      const agentData = {
        userId,
        name: formData.name,
        description: `Monitoring ${selectedPlatforms.join(
          ", "
        )} for keywords: ${formData.keywords.join(", ")}`,
        platforms: selectedPlatforms,
        keywords: formData.keywords,
        excludedKeywords: formData.excludedKeywords,
        platformConfigs,
        notificationsEnabled: formData.notificationsEnabled, // new field
        notificationFrequency: formData.notificationFrequency,
        notificationChannels: {
          email:
            formData.notificationChannels &&
            formData.notificationChannels.email,
          slack:
            formData.notificationChannels &&
            formData.notificationChannels.slack &&
            formData.slackConnected,
        },
        slackConnected: formData.slackConnected,
        color: formData.color,
        ...(isEditMode && agent?.id ? { id: agent.id } : {}),
      };

      // Simulated API call
      const endpoint = "/api/agents";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(agentData),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const successMessage = isEditMode
        ? "Agent updated successfully!"
        : "Agent created successfully!";

      const successDescription = isEditMode
        ? "Your agent settings have been updated."
        : "Your new monitoring agent is now active.";

      toast.success(successMessage, {
        description: successDescription,
      });

      onSuccess?.(agent?.id || "mock-agent-id");
    } catch (error) {
      const errorMessage = isEditMode
        ? "Failed to update agent"
        : "Failed to create agent";

      toast.error(errorMessage, {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const headerTitle = isEditMode ? "Edit Agent" : "Create a New Agent";
  const headerDescription = isEditMode
    ? "Update your Agent settings"
    : "Create a new Agent to monitor Potential Leads";

  const submitButtonText = isEditMode ? "Update" : "Create";
  const submitLoadingText = isEditMode ? "Updating..." : "Creating...";
  const submitIcon = isEditMode ? Save : Check;

  return (
    <div className="flex flex-col h-full bg-background rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-xl font-semibold">{headerTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {headerDescription}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2">
            AI Relevance Settings
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        {/* Name */}
        <div>
          <Label htmlFor="agent-name" className="font-medium mb-3 block">
            Name
          </Label>
          <Input
            id="agent-name"
            placeholder="Name your Agent"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Keywords Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Label className="font-medium">Keywords (required)</Label>
                <Info className="h-4 w-4 text-muted-foreground" />
                <Button
                  variant="link"
                  className="text-blue-500 p-0 h-auto text-sm"
                >
                  How to choose keywords
                </Button>
                <ExternalLink />
              </div>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Type keyword and hit enter"
                  value={tempInputs.keyword}
                  onChange={(e) =>
                    setTempInputs((prev) => ({
                      ...prev,
                      keyword: e.target.value,
                    }))
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), addItem("keyword", "keywords"))
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addItem("keyword", "keywords")}
                  disabled={!canAddKeyword() || !tempInputs.keyword.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Keywords Display */}
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.keywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="premium"
                    className="flex items-center gap-1"
                  >
                    {keyword}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removeItem("keywords", keyword)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">
                {formData.keywords.length}/{userPlan.keywords} keywords used
              </div>

              {/* Plan Limit Warning */}
              {formData.keywords.length >= userPlan.keywords && (
                <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
                  <AlertCircle className="h-4 w-4" />
                  Keyword limit reached. Upgrade to add more keywords.
                </div>
              )}
            </div>

            {/* Exclude Keywords */}
            <div>
              <Label className="font-medium mb-3 block">
                Exclude these words
              </Label>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Type keyword and hit enter"
                  value={tempInputs.excludedKeyword}
                  onChange={(e) =>
                    setTempInputs((prev) => ({
                      ...prev,
                      excludedKeyword: e.target.value,
                    }))
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(),
                    addItem("excludedKeyword", "excludedKeywords"))
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addItem("excludedKeyword", "excludedKeywords")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.excludedKeywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    {keyword}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removeItem("excludedKeywords", keyword)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Platforms */}
            <div>
              <Label className="font-medium mb-3 block">Platforms</Label>
              <div className="space-y-3">
                {PLATFORM_OPTIONS.map((platform) => (
                  <div
                    key={platform.id}
                    className="flex items-center space-x-3"
                  >
                    <Checkbox
                      id={platform.id}
                      checked={
                        formData.platforms[
                          platform.id as keyof typeof formData.platforms
                        ]
                      }
                      onCheckedChange={(checked) =>
                        handlePlatformChange(
                          platform.id as keyof FormData["platforms"],
                          !!checked
                        )
                      }
                    />
                    <div className="flex items-center gap-2">
                      <Image
                        alt="reddit-icon"
                        src={platform.logo}
                        width={20}
                        height={20}
                      />
                      <Label htmlFor={platform.id} className="font-medium">
                        {platform.name}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reddit Settings */}
            {formData.platforms.reddit && (
              <Collapsible
                open={redditSettingsOpen}
                onOpenChange={setRedditSettingsOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 p-0"
                  >
                    <Image
                      alt="reddit-icon"
                      src={"/platform_logos/redditIcon.png"}
                      width={24}
                      height={24}
                    />
                    <span className="font-medium">Reddit Settings</span>
                    {redditSettingsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4 pl-6">
                  {/* Subreddits */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm mb-2 block">
                        Only these subreddits
                      </Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Type subreddit name and hit enter"
                          value={tempInputs.includedSubreddit}
                          onChange={(e) =>
                            setTempInputs((prev) => ({
                              ...prev,
                              includedSubreddit: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const value = tempInputs.includedSubreddit.trim();
                              if (value) {
                                handleRedditSettingChange(
                                  "includedSubreddits",
                                  [
                                    ...formData.redditSettings
                                      .includedSubreddits,
                                    value,
                                  ]
                                );
                                setTempInputs((prev) => ({
                                  ...prev,
                                  includedSubreddit: "",
                                }));
                              }
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {formData.redditSettings.includedSubreddits.map(
                          (sub) => (
                            <Badge
                              key={sub}
                              variant="secondary"
                              className="text-xs flex items-center gap-1"
                            >
                              r/{sub}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-3 w-3 p-0 ml-1"
                                onClick={() => {
                                  handleRedditSettingChange(
                                    "includedSubreddits",
                                    formData.redditSettings.includedSubreddits.filter(
                                      (s) => s !== sub
                                    )
                                  );
                                }}
                              >
                                <X className="h-2 w-2" />
                              </Button>
                            </Badge>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm mb-2 block">
                        Exclude these subreddits
                      </Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Type subreddit and hit enter"
                          value={tempInputs.excludedSubreddit}
                          onChange={(e) =>
                            setTempInputs((prev) => ({
                              ...prev,
                              excludedSubreddit: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const value = tempInputs.excludedSubreddit.trim();
                              if (value) {
                                handleRedditSettingChange(
                                  "excludedSubreddits",
                                  [
                                    ...formData.redditSettings
                                      .excludedSubreddits,
                                    value,
                                  ]
                                );
                                setTempInputs((prev) => ({
                                  ...prev,
                                  excludedSubreddit: "",
                                }));
                              }
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {formData.redditSettings.excludedSubreddits.map(
                          (sub) => (
                            <Badge
                              key={sub}
                              variant="outline"
                              className="text-xs flex items-center gap-1"
                            >
                              r/{sub}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-3 w-3 p-0 ml-1"
                                onClick={() => {
                                  handleRedditSettingChange(
                                    "excludedSubreddits",
                                    formData.redditSettings.excludedSubreddits.filter(
                                      (s) => s !== sub
                                    )
                                  );
                                }}
                              >
                                <X className="h-2 w-2" />
                              </Button>
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reddit Options */}
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="search-posts"
                        checked={formData.redditSettings.searchPosts}
                        onCheckedChange={(checked) =>
                          handleRedditSettingChange("searchPosts", !!checked)
                        }
                      />
                      <Label htmlFor="search-posts" className="text-sm">
                        Search Posts
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="search-comments"
                        checked={formData.redditSettings.searchComments}
                        onCheckedChange={(checked) =>
                          handleRedditSettingChange("searchComments", !!checked)
                        }
                      />
                      <Label htmlFor="search-comments" className="text-sm">
                        Search Comments
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-nsfw"
                        checked={formData.redditSettings.includeNSFW}
                        onCheckedChange={(checked) =>
                          handleRedditSettingChange("includeNSFW", !!checked)
                        }
                      />
                      <Label htmlFor="include-nsfw" className="text-sm">
                        Include NSFW Results
                      </Label>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Agent Color */}
            <div>
              <Label className="font-medium mb-3 block">Agent Color</Label>
              <Select
                value={formData.color}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, color: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full bg-${color.value}-500`}
                        />
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notification Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium mb-0">Notifications</Label>
                <Switch
                  checked={formData.notificationsEnabled ?? true}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      notificationsEnabled: checked,
                    }))
                  }
                />
              </div>

              {/* Channels Dropdown - show only when notifications are enabled */}
              {formData.notificationsEnabled && (
                <div className="mt-2 space-y-2 border p-3 rounded-md">
                  {/* Email Toggle */}
                  <div className="flex items-center justify-between">
                    <span>Email</span>
                    <Switch
                      checked={formData.notificationChannels?.email ?? true}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          notificationChannels: {
                            ...prev.notificationChannels!,
                            email: checked,
                          },
                        }))
                      }
                    />
                  </div>

                  {/* Slack Toggle + Slack Connect */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span>Slack</span>
                      <Switch
                        checked={formData.notificationChannels?.slack ?? false}
                        onCheckedChange={(checked) => {
                          if (!formData.slackConnected) {
                            toast.error("Connect Slack first!");
                            return;
                          }
                          setFormData((prev) => ({
                            ...prev,
                            notificationChannels: {
                              ...prev.notificationChannels!,
                              slack: checked,
                            },
                          }));
                        }}
                      />
                    </div>
                    {/* Slack Connect Component */}
                    <SlackConnect />
                  </div>
                </div>
              )}
            </div>

            {/* Notification Frequency */}
            <div>
              <Label className="font-medium mb-3 block">
                Notification Frequency
              </Label>
              <Select
                value={formData.notificationFrequency}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    notificationFrequency: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userPlan.notificationFrequency.map((freq: string) => (
                    <SelectItem key={freq} value={freq}>
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center p-6 border-t bg-background">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            isLoading || !formData.name.trim() || formData.keywords.length === 0
          }
          className="min-w-[100px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {submitLoadingText}
            </>
          ) : (
            <>{submitButtonText}</>
          )}
        </Button>
      </div>
    </div>
  );
}
