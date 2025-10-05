"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Play,
  Pause,
  BarChart3,
  AlertCircle,
  Download,
  Filter,
  Target,
  Activity,
  Sparkles,
  ExternalLink,
  Archive,
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  LucidePodcast,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { timeAgo } from "@/lib/utils";
import Image from "next/image";
import { EditAgentButton } from "@/components/agents/edit-agent-button";
import {
  Agent,
  AgentDetails,
  PLATFORM_ICONS,
  Result,
} from "@/lib/constants/types";
import TriggerAgentButton from "@/components/agents/trigger-agent";

import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useAgentStore } from "@/store/agentstore";
import { LeadCard } from "@/components/leads/leads-cards";

type SortOption = "newest" | "oldest" | "relevance" | "leadScore";
type FilterOption = "all" | "posts" | "comments";
type PlatformFilter = "all" | "reddit" | "twitter" | "linkedin" | "bluesky";
type RelevanceFilter = "all" | "high" | "medium" | "low";

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [agentDetails, setAgentDetails] = useState<
    AgentDetails["agent"] | null
  >(null);
  const [filteredResults, setFilteredResults] = useState<Result[]>([]);
  const [displayedResults, setDisplayedResults] = useState<Result[]>([]);
  const [showCount, setShowCount] = useState(5);

  // Filter and sort states
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [relevanceFilter, setRelevanceFilter] =
    useState<RelevanceFilter>("all");

  const agentId = params.agentId as string;

  // Use Zustand store
  const { agents } = useAgentStore();

  // Initial load: check store first, then fetch if needed
  useEffect(() => {
    const loadAgentDetails = async () => {
      setIsLoading(true);

      // Try to find agent in store first
      const agentInStore = agents.find((a) => a.id === agentId);

      if (agentInStore) {
        // Use store data
        setAgentDetails(agentInStore);
        setFilteredResults(agentInStore.recentResults || []);
        setIsLoading(false);
      } else {
        // Fetch from API if not in store
        try {
          const response = await fetch(`/api/agents/${agentId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error("Failed to fetch agent details");
          }

          setAgentDetails(data.agent);
          setFilteredResults(data.agent.recentResults || []);
        } catch (error) {
          toast.error("Error", {
            description:
              error instanceof Error ? error.message : "Failed to fetch data",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadAgentDetails();
  }, [agentId, agents]);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!agentId) return;
    setIsRefreshing(true);

    try {
      const res = await fetch(`/api/agents/${agentId}`);
      if (!res.ok) throw new Error("Failed to fetch agent");

      const data = await res.json();
      const updatedAgent: Agent = data.agent;

      // Update store
      useAgentStore.getState().updateAgentById(agentId, updatedAgent);

      // Update local state
      setAgentDetails(updatedAgent);
      setFilteredResults(updatedAgent.recentResults || []);

      toast.success("Agent data refreshed successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to refresh agent data");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    if (!agentDetails) return;

    let filtered = [...agentDetails.recentResults];

    // Apply type filter
    if (filterBy !== "all") {
      const type = filterBy === "posts" ? "post" : "comment";
      filtered = filtered.filter((result) => result.type === type);
    }

    // Apply platform filter
    if (platformFilter !== "all") {
      filtered = filtered.filter(
        (result) => result.platform === platformFilter
      );
    }

    // Apply relevance filter
    if (relevanceFilter !== "all") {
      filtered = filtered.filter((result) => {
        const score = result.relevanceScore || 0;
        if (relevanceFilter === "high") return score >= 85;
        if (relevanceFilter === "medium") return score >= 70 && score < 85;
        if (relevanceFilter === "low") return score < 70;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.postCreatedAt).getTime() -
            new Date(a.postCreatedAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.postCreatedAt).getTime() -
            new Date(b.postCreatedAt).getTime()
          );
        case "relevance":
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        case "leadScore":
          return (b.leadScore || 0) - (a.leadScore || 0);
        default:
          return 0;
      }
    });

    setFilteredResults(filtered);
    setShowCount(5);
  }, [agentDetails, sortBy, filterBy, platformFilter, relevanceFilter]);

  useEffect(() => {
    setDisplayedResults(filteredResults.slice(0, showCount));
  }, [filteredResults, showCount]);

  const toggleAgentStatus = async () => {
    if (!agentDetails) return;

    try {
      const newStatus = agentDetails.status === "active" ? "paused" : "active";

      const response = await fetch(`/api/agents/${agentId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle agent status");
      }

      setAgentDetails((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
            }
          : null
      );

      toast.success(`Agent ${newStatus === "active" ? "activated" : "paused"}`);
    } catch (error) {
      toast.error("Error", {
        description: "Failed to update agent status",
      });
    }
  };

  const exportResults = () => {
    if (!agentDetails) return;
    const csvData = filteredResults.map((result) => ({
      Type: result.type,
      Platform: result.platform,
      Content: result.content,
      Author: result.author,
      "Relevance Score": result.relevanceScore,
      "Lead Score": result.leadScore,
      "Created At": new Date(result.postCreatedAt).toISOString(),
    }));
    console.log("Exporting results:", csvData);
    toast.success("Export functionality will be implemented");
  };

  const handleArchive = async (resultId: string) => {
    try {
      const response = await fetch(`/api/leads/${resultId}/archive`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to archive");
      toast.success("Lead archived successfully");
      setFilteredResults((prev) => prev.filter((r) => r.id !== resultId));
    } catch (error) {
      toast.error("Failed to archive lead");
    }
  };

  const handleShare = (result: Result) => {
    const shareData = {
      title: "Skroub Lead Discovery",
      text: `Check out this lead found by Skroub:\n\n${result.content.slice(
        0,
        150
      )}...`,
      url: result.url,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
      toast.success("Share link copied to clipboard");
    }
  };


  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agentDetails) {
    return (
      <div className="flex h-[calc(100vh-5rem)] flex-col items-center justify-center">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Agent Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The agent you're looking for doesn't exist or you don't have access to
          it.
        </p>
        <Button asChild>
          <Link href="/agents">Back to Agents</Link>
        </Button>
      </div>
    );
  }

  const agent = agentDetails;

  const agentForEdit: any = {
    id: agent.id,
    name: agent.name,
    description: agent.description || "",
    keywords: agent.keywords,
    excludedKeywords: agent.excludedKeywords ?? [],
    platforms: agent.platforms,
    platformConfigs: agent.platformConfigs as Agent["platformConfigs"],
    notificationFrequency: (agent.notificationFrequency ||
      "daily") as Agent["notificationFrequency"],
    notificationsEnabled: agent.notificationsEnabled,
    notificationChannels: {
      email: agent.notificationChannels.email,
      slack: agent.notificationChannels.slack,
    },
    slackConnected: agent.notificationChannels.slack,
    color: agent.color || "#000000",
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500 hover:bg-green-600";
      case "paused":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "error":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl lg:text-3xl font-bold">{agent.name}</h1>
            <Badge
              variant="secondary"
              className={`${getStatusColor(agent.status)} text-white`}
            >
              {agent.status}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {agent.keywords.map((keyword: string, idx: number) => (
              <Badge key={idx} variant="premium" className="text-xs">
                {keyword}
              </Badge>
            ))}
            {agent.keywords.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{agent.keywords.length - 5} more
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={toggleAgentStatus}
            className="flex items-center gap-2"
          >
            {agent.status === "active" ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {agent.status === "active" ? "Pause" : "Resume"}
          </Button>

          <EditAgentButton agent={agentForEdit} userId={session?.user.id!} />
          <TriggerAgentButton agentId={agent.id} />
          <Button
            variant="outline"
            onClick={exportResults}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">
                  <AnimatedCounter value={agent.performance!.totalLeads} />
                </p>
              </div>
              <LucidePodcast className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Relevance</p>
                <p className="text-2xl font-bold">
                  <AnimatedCounter
                    value={agent.performance.averageRelevanceScore}
                    suffix="%"
                  />
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last 24h</p>
                <p className="text-2xl font-bold">
                  <AnimatedCounter value={agent.performance.last24Hours} />
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Qualified Leads</p>
                <p className="text-2xl font-bold">
                  <AnimatedCounter value={agent.performance.qualifiedLeads} />
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="w-4 h-4 text-muted-foreground" />

              <Select
                value={sortBy}
                onValueChange={(value: SortOption) => setSortBy(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Most Recent</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="relevance">By Relevance</SelectItem>
                  <SelectItem value="leadScore">By Lead Score</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={platformFilter}
                onValueChange={(value: PlatformFilter) =>
                  setPlatformFilter(value)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="reddit">Reddit</SelectItem>
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                  <SelectItem value="bluesky">Bluesky</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={relevanceFilter}
                onValueChange={(value: RelevanceFilter) =>
                  setRelevanceFilter(value)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Relevance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Relevance</SelectItem>
                  <SelectItem value="high">High (85%+)</SelectItem>
                  <SelectItem value="medium">Medium (70-84%)</SelectItem>
                  <SelectItem value="low">Low (&lt;70%)</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterBy}
                onValueChange={(value: FilterOption) => setFilterBy(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="posts">Posts Only</SelectItem>
                  <SelectItem value="comments">Comments Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {displayedResults.length} of {filteredResults.length}{" "}
              results
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results List */}
      <div className="space-y-4">
        {displayedResults.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground max-w-md">
                  {agent.recentResults.length === 0
                    ? "This agent hasn't found any results yet. Check back later..."
                    : "No results match your current filters. Try adjusting your filter criteria."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {displayedResults.map((result) => (
              <LeadCard
                key={result.id}
                result={result}
                agentName={agent.name}
                onArchive={handleArchive}
                onShare={handleShare}
                showAuthorInContent={true}
              />
            ))}

            {/* Load More / View All */}
            {filteredResults.length > displayedResults.length && (
              <div className="flex justify-center gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCount((prev) => prev + 10)}
                  className="flex items-center gap-2"
                >
                  Load More
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => router.push("/leads")}
                  className="flex items-center gap-2"
                >
                  View All Leads
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
