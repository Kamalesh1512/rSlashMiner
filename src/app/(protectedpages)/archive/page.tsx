"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PLATFORM_ICONS, Result } from "@/lib/constants/types";
import { useEffect, useState } from "react";
import {
  Archive,
  RotateCcw,
  Calendar,
  MessageSquare,
  TrendingUp,
  ExternalLink,
  Search,
  Filter,
} from "lucide-react";

import { toast } from "sonner";

export default function ArchivePage() {
  const [leads, setLeads] = useState<Result[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/leads/archived")
      .then((res) => res.json())
      .then((data) => setLeads(data.leads || []))
      .catch((err) => console.error("Failed to fetch archived leads:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleRecover = async (id: string) => {
    const res = await fetch(`/api/leads/${id}/recover`, { method: "POST" });
    if (res.ok) {
      toast.success("Lead recovered");
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } else {
      toast.error("Failed to recover");
    }
  };
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      searchTerm === "" ||
      lead.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform =
      selectedPlatform === "all" || lead.platform === selectedPlatform;
    return matchesSearch && matchesPlatform;
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-muted-foreground flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin"></div>
          Loading archived leads...
        </div>
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <Archive className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Archive</h1>
                <p className="text-muted-foreground text-sm">
                  Recovered and archived leads
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Archive className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              No archived leads yet
            </p>
            <p className="text-muted-foreground/70 text-sm mt-2">
              Archived leads will appear here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-muted rounded-lg">
              <Archive className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Archive</h1>
              <p className="text-muted-foreground text-sm">
                {leads.length} archived {leads.length === 1 ? "lead" : "leads"}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6 flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search archived leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="pl-10 pr-8 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none text-foreground"
            >
              <option value="all">All Platforms</option>
              <option value="reddit">Reddit</option>
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
              <option value="bluesky">Bluesky</option>
            </select>
          </div>
        </div>

        {/* Leads List */}
        <div className="space-y-4">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="group bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300 relative overflow-hidden opacity-60 hover:opacity-100"
            >
              {/* Archived Watermark */}
              <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Archive className="w-32 h-32 text-foreground" />
              </div>

              <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-3 gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {/* Platform Icon */}
                      {PLATFORM_ICONS[lead.platform] && (
                        <div className="w-5 h-5 rounded overflow-hidden flex items-center justify-center bg-transparent">
                          <img
                            src={PLATFORM_ICONS[lead.platform]}
                            alt={lead.platform}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <span className="text-xs font-medium text-muted-foreground capitalize">
                        {lead.platform}
                      </span>
                      {lead.community && (
                        <span className="text-xs text-muted-foreground/70">
                          {lead.community}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-2">
                      {lead.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {lead.content}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRecover(lead.id)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Recover
                  </button>
                </div>

                {/* Metadata Row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  {lead.author && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">@{lead.author}</span>
                    </span>
                  )}
                  {/* {lead.score !== null && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {lead.score} score
                    </span>
                  )} */}
                  {lead.metadata?.numComments !== null && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {lead.metadata?.numComments} comments
                    </span>
                  )}
                  {lead.relevanceScore !== null && (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                      {Math.round(lead.relevanceScore)}% relevant
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Archived {formatDate(lead.archivedAt)}</span>
                  </div>
                  <a
                    href={lead.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <span>View original</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
