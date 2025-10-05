"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Archive,
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
  Tag,
  TagIcon,
} from "lucide-react";
import { PLATFORM_ICONS, Result } from "@/lib/constants/types";
import { timeAgo } from "@/lib/utils";
import { toast } from "sonner";

interface LeadCardProps {
  result: Result & { agentName?: string };
  agentName?: string;
  onArchive?: (resultId: string) => Promise<void>;
  onShare?: (result: Result) => void;
  showAuthorInContent?: boolean; // To differentiate between agent page and leads page style
}

export function LeadCard({
  result,
  agentName,
  onArchive,
  onShare,
  showAuthorInContent = false,
}: LeadCardProps) {
  const [isArchiving, setIsArchiving] = useState(false);

  const contentRef = useRef<HTMLParagraphElement>(null);
  const [shouldFade, setShouldFade] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const style = window.getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight);
    const visibleHeight = el.clientHeight;

    // check if content takes more than 1 line visually
    const contentLines = Math.round(el.scrollHeight / lineHeight);
    setShouldFade(contentLines > 1);
  }, [result.content]);

  const highlightKeywords = (text: string, keywords: string | null) => {
    if (!keywords) return text;

    const keywordList = keywords.split(",").map((k) => k.trim());
    let highlightedText = text;

    keywordList.forEach((keyword) => {
      const regex = new RegExp(`(${keyword})`, "gi");
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-yellow-200 dark:bg-yellow-600 font-semibold px-1 rounded">$1</mark>'
      );
    });

    return highlightedText;
  };

  const getRelevanceBadge = (score: number | null) => {
    if (!score)
      return {
        color:
          "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
        label: "N/A",
      };
    if (score >= 85)
      return {
        color:
          "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
        label: `${score}%`,
      };
    if (score >= 70)
      return {
        color:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
        label: `${score}%`,
      };
    return {
      color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      label: `${score}%`,
    };
  };

  const getSentimentIcon = (score: number | null) => {
    if (score === null) return <Minus className="w-4 h-4 text-gray-400" />;
    if (score > 0.3) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (score < -0.3) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const handleArchive = async () => {
    if (!onArchive) return;
    setIsArchiving(true);
    try {
      await onArchive(result.id);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(result);
    } else {
      // Default share behavior
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
    }
  };

  const relevanceBadge = getRelevanceBadge(result.relevanceScore);
  const displayAgentName = agentName || result.agentName;

  return (
    <Card className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-md hover:border-primary/20">
      {/* Left relevance indicator */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{
          backgroundColor:
            result.relevanceScore && result.relevanceScore >= 85
              ? "#22c55e"
              : result.relevanceScore && result.relevanceScore >= 70
              ? "#f59e0b"
              : "#ef4444",
        }}
      />

      {/* HEADER */}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {PLATFORM_ICONS[result.platform] && (
            <div className="w-5 h-5 flex items-center justify-center">
              <Image
                src={PLATFORM_ICONS[result.platform]}
                alt={result.platform}
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
          )}
          <span className="text-xs text-muted-foreground">
            <strong className="text-foreground font-semibold">
              {displayAgentName}
            </strong>{" "}
            discovered a lead from{" "}
            {result.platform === "reddit"
              ? `r/${result.metadata?.subreddit}`
              : result.platform}
            .
          </span>
        </div>
      </CardHeader>

      {/* CONTENT */}
      <CardContent className="pt-1 pb-3 space-y-2 relative overflow-hidden">
        {result.title && (
          <h3
            className="text-base font-semibold text-foreground leading-snug line-clamp-2"
            dangerouslySetInnerHTML={{
              __html: highlightKeywords(result.title, result.matchedKeywords),
            }}
          />
        )}

        {result.content && (
          <div className="relative">
            <p
              ref={contentRef}
              className="text-sm text-muted-foreground leading-relaxed line-clamp-3 pr-2"
              dangerouslySetInnerHTML={{
                __html: highlightKeywords(
                  result.content,
                  result.matchedKeywords
                ),
              }}
            />
            {shouldFade && (
              <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            )}
          </div>
        )}

        {showAuthorInContent && (
          <div className="flex items-center gap-2 text-sm pt-1">
            <span className="font-semibold text-foreground">
              @{result.authorHandle || result.author}
            </span>
            <span className="text-muted-foreground">
              · {timeAgo(new Date(result.postCreatedAt))}
            </span>
            {/* Topic Categories */}
            {result.topicCategories && result.topicCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {result.topicCategories.map((category: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-foreground/80 text-xs font-medium"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    {category}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* FOOTER */}
      <CardFooter className="py-1.5 px-4 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
        {/* Metrics */}
        <div className="flex items-center gap-1 flex-wrap">
          <div
            className={`px-1.5 py-0.5 rounded-full font-medium transition-all ${relevanceBadge.color}`}
          >
            Relevance: {relevanceBadge.label}
          </div>

          {result.buyingIntent != null && result.buyingIntent !== undefined && (
            <div className="px-1.5 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400">
              Intent: {Math.round(result.buyingIntent * 100)}%
            </div>
          )}

          {/* {result.leadScore != null && (
            <div className="px-1.5 py-0.5 rounded-full font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
              Lead Score: {result.leadScore}%
            </div>
          )} */}

          {result.sentimentScore !== null && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
              {getSentimentIcon(result.sentimentScore)}
              <span className="text-xs font-medium">
                {result.sentimentScore > 0
                  ? "Positive"
                  : result.sentimentScore < 0
                  ? "Negative"
                  : "Neutral"}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(result.url, "_blank")}
            className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
            title="View on platform"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
          {onArchive && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleArchive}
              disabled={isArchiving}
              className="h-6 w-6 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20"
              title="Archive"
            >
              <Archive className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
            title="Share"
          >
            <Share2 className="w-3 h-3" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
