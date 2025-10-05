"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  Search,
  Download,
  ExternalLink,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Archive,
  Share2,
  Filter,
  Sparkles,
  RefreshCw,
  BarChart3,
  Activity,
  Users,
  Bot,
  LucidePodcast,
  MessageSquare,
} from "lucide-react";
import { PLATFORM_ICONS, Result } from "@/lib/constants/types";
import { useAgentStore } from "@/store/agentstore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { timeAgo } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { LeadCard } from "@/components/leads/leads-cards";

type SortOption =
  | "newest"
  | "oldest"
  | "relevance"
  | "leadScore"
  | "buyingIntent";
type PlatformFilter = "all" | "reddit" | "twitter" | "linkedin" | "bluesky";
type RelevanceFilter = "all" | "high" | "medium" | "low";
type TypeFilter = "all" | "post" | "comment";

export default function LeadsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { agents, setAgents } = useAgentStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [relevanceFilter, setRelevanceFilter] =
    useState<RelevanceFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const allResults = useMemo(() => {
    return agents.flatMap((agent) =>
      (agent.recentResults || [])
        .filter((result) => !result.isArchived)
        .map((result) => ({
          ...result,
          agentId: agent.id,
          agentName: agent.name,
        }))
    );
  }, [agents]);
  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      if (status === "unauthenticated") {
        router.push("/login");
        return;
      }

      if (status !== "authenticated") return;

      setIsLoading(true);

      try {
        // Check if we have agents in store
        if (agents.length === 0) {
          // Fetch from API
          const response = await fetch("/api/agents");
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Failed to fetch agents");
          }

          setAgents(data.agents || []);
        }
      } catch (error) {
        toast.error("Error", {
          description:
            error instanceof Error ? error.message : "Failed to fetch data",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [status, router, agents.length, setAgents]);

  // Manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/agents");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch agents");
      }

      setAgents(data.agents || []);
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Failed to refresh data",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Apply filters and sorting
  const filteredResults = useMemo(() => {
    let filtered = [...allResults];

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (result) =>
          result.content.toLowerCase().includes(query) ||
          result.title?.toLowerCase().includes(query) ||
          result.author?.toLowerCase().includes(query) ||
          result.agentName?.toLowerCase().includes(query)
      );
    }

    // Platform filter
    if (platformFilter !== "all") {
      filtered = filtered.filter(
        (result) => result.platform === platformFilter
      );
    }

    // Relevance filter
    if (relevanceFilter !== "all") {
      filtered = filtered.filter((result) => {
        const score = result.relevanceScore || 0;
        if (relevanceFilter === "high") return score >= 85;
        if (relevanceFilter === "medium") return score >= 70 && score < 85;
        if (relevanceFilter === "low") return score < 70;
        return true;
      });
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((result) => result.type === typeFilter);
    }

    // Agent filter
    if (agentFilter !== "all") {
      filtered = filtered.filter((result) => result.agentId === agentFilter);
    }

    // Tab-based filtering
    if (activeTab === "high") {
      filtered = filtered.filter(
        (result) => (result.relevanceScore || 0) >= 85
      );
    } else if (activeTab === "qualified") {
      filtered = filtered.filter((result) => result.isQualifiedLead);
    }

    // Sorting
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
        case "buyingIntent":
          return (b.buyingIntent || 0) - (a.buyingIntent || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    allResults,
    searchQuery,
    platformFilter,
    relevanceFilter,
    typeFilter,
    agentFilter,
    sortBy,
    activeTab,
  ]);

  // Calculate statistics
  const stats = useMemo(() => {
    const high = allResults.filter((r) => (r.relevanceScore || 0) >= 85);
    const qualified = allResults.filter((r) => r.isQualifiedLead);
    const avgRelevance =
      allResults.length > 0
        ? Math.round(
            allResults.reduce((acc, r) => acc + (r.relevanceScore || 0), 0) /
              allResults.length
          )
        : 0;

    // Count unique agents that have generated leads
    const uniqueAgentIds = new Set(allResults.map((r) => r.agentId));
    const activeAgents = uniqueAgentIds.size;

    return {
      total: allResults.length,
      high: high.length,
      qualified: qualified.length,
      avgRelevance,
      activeAgents,
    };
  }, [allResults]);

  const handleArchive = async (resultId: string) => {
    try {
      const response = await fetch(`/api/leads/${resultId}/archive`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to archive");

      toast.success("Lead archived successfully");

      // Update store by refetching agents
      await handleRefresh();
    } catch (error) {
      toast.error("Failed to archive lead");
    }
  };

  const handleShare = (result: Result) => {
    const shareData = {
      title: "Skroub Lead Discovery",
      text: `Found by Skroub - ${
        result.platform
      } lead:\n\n${result.content.slice(0, 150)}...`,
      url: result.url,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
      toast.success("Share link copied to clipboard");
    }
  };

  const exportLeads = () => {
    const csvData = filteredResults.map((result) => ({
      Platform: result.platform,
      Type: result.type,
      Content: result.content,
      Author: result.author,
      Community: result.community,
      "Relevance Score": result.relevanceScore,
      "Lead Score": result.leadScore,
      "Buying Intent": result.buyingIntent,
      Sentiment: result.sentimentScore,
      Agent: result.agentName,
      URL: result.url,
      "Created At": new Date(result.postCreatedAt).toISOString(),
    }));

    console.log("Exporting leads:", csvData);
    toast.success("Export functionality will be implemented");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setPlatformFilter("all");
    setRelevanceFilter("all");
    setTypeFilter("all");
    setAgentFilter("all");
    setSortBy("newest");
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">All Leads</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive view of all discovered leads across platforms
          </p>
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
          <Button onClick={exportLeads} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold">
                  <AnimatedCounter value={stats.activeAgents} />
                </p>
              </div>
              <Bot className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">
                  <AnimatedCounter value={stats.total} />
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
                <p className="text-sm text-muted-foreground">High Quality</p>
                <p className="text-2xl font-bold">
                  <AnimatedCounter value={stats.high} />
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Qualified</p>
                <p className="text-2xl font-bold">
                  <AnimatedCounter value={stats.qualified} />
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Relevance</p>
                <p className="text-2xl font-bold">
                  <AnimatedCounter value={stats.avgRelevance} suffix="%" />
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs with Filter Dialog */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All ({allResults.length})</TabsTrigger>
            <TabsTrigger value="high">
              High Relevance (
              {allResults.filter((r) => (r.relevanceScore || 0) >= 85).length})
            </TabsTrigger>
            <TabsTrigger value="qualified">
              Qualified ({allResults.filter((r) => r.isQualifiedLead).length})
            </TabsTrigger>
          </TabsList>

          <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
                {(searchQuery ||
                  platformFilter !== "all" ||
                  relevanceFilter !== "all" ||
                  typeFilter !== "all" ||
                  agentFilter !== "all") && (
                  <Badge
                    variant="secondary"
                    className="ml-1 px-1.5 py-0 text-xs"
                  >
                    Active
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-4xl h-auto max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Filter Leads</DialogTitle>
                <DialogDescription>
                  Refine your lead search with advanced filters
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search leads..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select
                    value={sortBy}
                    onValueChange={(value: SortOption) => setSortBy(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Most Recent</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="leadScore">Lead Score</SelectItem>
                      <SelectItem value="buyingIntent">
                        Buying Intent
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Platform Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Platform</label>
                  <Select
                    value={platformFilter}
                    onValueChange={(value: PlatformFilter) =>
                      setPlatformFilter(value)
                    }
                  >
                    <SelectTrigger>
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
                </div>

                {/* Relevance Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Relevance Score</label>
                  <Select
                    value={relevanceFilter}
                    onValueChange={(value: RelevanceFilter) =>
                      setRelevanceFilter(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Relevance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Relevance</SelectItem>
                      <SelectItem value="high">High (85%+)</SelectItem>
                      <SelectItem value="medium">Medium (70-84%)</SelectItem>
                      <SelectItem value="low">Low (&lt;70%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content Type</label>
                  <Select
                    value={typeFilter}
                    onValueChange={(value: TypeFilter) => setTypeFilter(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="post">Posts</SelectItem>
                      <SelectItem value="comment">Comments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Agent Filter */}
                {agents.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Agent</label>
                    <Select value={agentFilter} onValueChange={setAgentFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Agent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Agents</SelectItem>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    Clear All
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredResults.length} of {allResults.length}{" "}
                    results
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Results */}
        <TabsContent value={activeTab} className="space-y-4 mt-0">
          {filteredResults.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Target className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No leads found</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {allResults.length === 0
                    ? "No leads have been discovered yet. Create an agent to start monitoring."
                    : "No leads match your current filters. Try adjusting your search criteria."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredResults.map((result) => (
              <LeadCard
                key={result.id}
                result={result}
                onArchive={handleArchive}
                onShare={handleShare}
                showAuthorInContent={true}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
