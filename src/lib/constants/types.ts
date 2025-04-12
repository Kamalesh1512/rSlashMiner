import { RecentResult } from "@/app/(protectedpages)/dashboard/_components/recents-details";
import {
  LayoutDashboard,
  Bot,
  Search,
  Bell,
  Settings,
  HelpCircle,
  BarChart3,
} from "lucide-react";

/**
 * Fallback keywords if the AI generation fails
 */
export function fallbackKeywords(industry: string): string[] {
  const commonKeywords = [
    "recommendations",
    "looking for",
    "need help with",
    "alternative to",
    "best solution for",
    "how to",
    "struggling with",
    "advice needed",
    "problem with",
    "tool for",
  ];

  const industryKeywords: Record<string, string[]> = {
    technology: [
      "software",
      "app",
      "automation",
      "integration",
      "API",
      "SaaS",
      "platform",
      "tech stack",
    ],
    ecommerce: [
      "online store",
      "shipping",
      "inventory",
      "marketplace",
      "dropshipping",
      "ecommerce platform",
    ],
    finance: [
      "budgeting",
      "investing",
      "payment processing",
      "financial planning",
      "accounting software",
    ],
    health: [
      "fitness app",
      "health tracking",
      "wellness",
      "nutrition",
      "mental health",
      "healthcare",
    ],
    education: [
      "learning platform",
      "online courses",
      "education software",
      "teaching tools",
      "e-learning",
    ],
    marketing: [
      "marketing automation",
      "analytics",
      "social media tools",
      "content marketing",
      "SEO",
    ],
    food: [
      "food delivery",
      "recipe app",
      "meal planning",
      "restaurant tech",
      "food service",
    ],
    travel: [
      "booking system",
      "travel planning",
      "itinerary",
      "accommodation",
      "travel tech",
    ],
    entertainment: [
      "streaming",
      "content creation",
      "media management",
      "entertainment platform",
    ],
    other: [
      "business solution",
      "productivity",
      "management tool",
      "collaboration",
      "workflow",
    ],
  };

  return [
    ...commonKeywords,
    ...(industryKeywords[industry] || industryKeywords.other),
  ];
}

/**
 * Fallback subreddits if the AI generation fails
 */
export function fallbackSubreddits(industry: string): string[] {
  const commonSubreddits = [
    "AskReddit",
    "HowTo",
    "technology",
    "Entrepreneur",
    "smallbusiness",
  ];

  const industrySubreddits: Record<string, string[]> = {
    technology: [
      "webdev",
      "programming",
      "SaaS",
      "software",
      "techsupport",
      "startups",
      "technology",
    ],
    ecommerce: [
      "ecommerce",
      "Entrepreneur",
      "FulfillmentByAmazon",
      "shopify",
      "smallbusiness",
    ],
    finance: [
      "personalfinance",
      "investing",
      "FinancialPlanning",
      "Banking",
      "CreditCards",
    ],
    health: [
      "fitness",
      "nutrition",
      "loseit",
      "HealthIT",
      "healthcare",
      "running",
    ],
    education: [
      "education",
      "Teachers",
      "edtech",
      "OnlineEducation",
      "college",
      "gradschool",
    ],
    marketing: [
      "marketing",
      "SEO",
      "socialmedia",
      "DigitalMarketing",
      "content_marketing",
    ],
    food: ["Cooking", "MealPrepSunday", "food", "FoodTech", "restaurateur"],
    travel: [
      "travel",
      "backpacking",
      "TravelHacks",
      "TravelTech",
      "digitalnomad",
    ],
    entertainment: [
      "entertainment",
      "movies",
      "Music",
      "podcasts",
      "streaming",
    ],
    other: ["productivity", "business", "WorkOnline", "freelance", "remote"],
  };

  return [
    ...commonSubreddits,
    ...(industrySubreddits[industry] || industrySubreddits.other),
  ];
}

export const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Agents",
    href: "/agents",
    icon: Bot,
  },
  {
    name: "Results",
    href: "/results",
    icon: BarChart3,
  },
  {
    name: "Monitoring",
    href: "/monitoring",
    icon: Search,
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    name: "Help & Support",
    href: "/help",
    icon: HelpCircle,
  },
];

// Define interfaces for our data types
export interface Agent {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt: Date | null;
  runCount: number;
  configuration: {
    industry: string;
    notificationMethod: "email" | "whatsapp" | "both";
    notificationFrequency: "realtime" | "hourly" | "daily" | "weekly";
    relevanceThreshold: number;
    whatsappNumber?: string;
    scheduleType: "always" | "specific";
    scheduleDays?: {
      monday: boolean;
      tuesday: boolean;
      wednesday: boolean;
      thursday: boolean;
      friday: boolean;
      saturday: boolean;
      sunday: boolean;
    };
    scheduleTime?: string;
  };
  keywords: { id: string; keyword: string }[];
  subreddits: { id: string; subredditName: string }[];
  results?: {
    id: string;
    title: string;
    subreddit: string;
    timestamp: string;
    relevanceScore: number;
    type: "post" | "comment";
  }[];
}

// Hardcoded data
export const agents: Agent[] = [
  {
    id: "1",
    name: "SaaS Product Monitor",
    description:
      "Monitoring for potential customers interested in SaaS analytics and customer feedback tools",
    isActive: true,
    createdAt: new Date("2023-10-15T10:30:00Z"),
    updatedAt: new Date("2023-11-01T14:45:00Z"),
    lastRunAt: new Date("2023-11-05T08:15:00Z"),
    runCount: 42,
    configuration: {
      industry: "technology",
      notificationMethod: "email",
      notificationFrequency: "daily",
      relevanceThreshold: 70,
      scheduleType: "always",
    },
    keywords: [
      { id: "k1", keyword: "analytics" },
      { id: "k2", keyword: "customer feedback" },
      { id: "k3", keyword: "SaaS tool" },
      { id: "k4", keyword: "data visualization" },
      { id: "k5", keyword: "user insights" },
    ],
    subreddits: [
      { id: "s1", subredditName: "SaaS" },
      { id: "s2", subredditName: "startups" },
      { id: "s3", subredditName: "ProductManagement" },
      { id: "s4", subredditName: "analytics" },
      { id: "s5", subredditName: "CustomerSuccess" },
    ],
    results: [
      {
        id: "r1",
        title: "Looking for a tool to analyze customer feedback",
        subreddit: "SaaS",
        timestamp: "2 hours ago",
        relevanceScore: 92,
        type: "post",
      },
      {
        id: "r3",
        title: "Frustrated with current analytics options",
        subreddit: "startups",
        timestamp: "1 day ago",
        relevanceScore: 75,
        type: "post",
      },
      {
        id: "r7",
        title: "Anyone using AI for customer support?",
        subreddit: "CustomerSuccess",
        timestamp: "5 days ago",
        relevanceScore: 82,
        type: "post",
      },
    ],
  },
  {
    id: "2",
    name: "Competitor Tracker",
    description: "Monitoring mentions of competitors and related products",
    isActive: true,
    createdAt: new Date("2023-09-20T15:45:00Z"),
    updatedAt: new Date("2023-10-25T11:30:00Z"),
    lastRunAt: new Date("2023-11-04T09:30:00Z"),
    runCount: 38,
    configuration: {
      industry: "technology",
      notificationMethod: "both",
      notificationFrequency: "realtime",
      relevanceThreshold: 80,
      whatsappNumber: "+12345678901",
      scheduleType: "specific",
      scheduleDays: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      },
      scheduleTime: "09:00",
    },
    keywords: [
      { id: "k6", keyword: "competitor name" },
      { id: "k7", keyword: "alternative to" },
      { id: "k8", keyword: "switching from" },
      { id: "k9", keyword: "better than" },
    ],
    subreddits: [
      { id: "s6", subredditName: "marketing" },
      { id: "s7", subredditName: "technology" },
      { id: "s8", subredditName: "webdev" },
    ],
    results: [
      {
        id: "r2",
        title: "Need help finding a Reddit monitoring solution",
        subreddit: "marketing",
        timestamp: "5 hours ago",
        relevanceScore: 98,
        type: "post",
      },
      {
        id: "r6",
        title: "Re: Need a tool for social listening",
        subreddit: "socialmedia",
        timestamp: "4 days ago",
        relevanceScore: 78,
        type: "comment",
      },
    ],
  },
  {
    id: "3",
    name: "Product Hunt Monitor",
    description:
      "Tracking discussions about Product Hunt launches and feedback",
    isActive: false,
    createdAt: new Date("2023-10-05T08:15:00Z"),
    updatedAt: new Date("2023-11-02T16:20:00Z"),
    lastRunAt: new Date("2023-11-02T16:20:00Z"),
    runCount: 25,
    configuration: {
      industry: "technology",
      notificationMethod: "email",
      notificationFrequency: "daily",
      relevanceThreshold: 75,
      scheduleType: "always",
    },
    keywords: [
      { id: "k10", keyword: "product hunt" },
      { id: "k11", keyword: "launched on" },
      { id: "k12", keyword: "new product" },
      { id: "k13", keyword: "startup launch" },
    ],
    subreddits: [
      { id: "s9", subredditName: "ProductHunt" },
      { id: "s10", subredditName: "SideProject" },
      { id: "s11", subredditName: "EntrepreneurRideAlong" },
      { id: "s12", subredditName: "startups" },
      { id: "s13", subredditName: "alphaandbetausers" },
      { id: "s14", subredditName: "IndieBiz" },
      { id: "s15", subredditName: "roastmystartup" },
    ],
    results: [
      {
        id: "r4",
        title: "Best way to track competitor mentions?",
        subreddit: "EntrepreneurRideAlong",
        timestamp: "2 days ago",
        relevanceScore: 88,
        type: "post",
      },
      {
        id: "r8",
        title: "Sentiment analysis tools recommendation",
        subreddit: "datascience",
        timestamp: "1 week ago",
        relevanceScore: 90,
        type: "post",
      },
    ],
  },
];

// Define interfaces for our data types
export interface Result {
  id: string;
  title: string;
  subreddit: string;
  timestamp: string;
  content: string;
  relevanceScore: number;
  agentId: string;
  agentName: string;
  author: string;
  url: string;
  type: "post" | "comment";
  matchedKeywords: string[];
}

// Hardcoded data
export const results: Result[] = [
  {
    id: "1",
    title: "Looking for a tool to analyze customer feedback",
    subreddit: "SaaS",
    timestamp: "2 hours ago",
    content:
      "I'm looking for a tool that can help me analyze customer feedback from multiple sources. Any recommendations?",
    relevanceScore: 92,
    agentId: "1",
    agentName: "SaaS Product Monitor",
    author: "techfounder123",
    url: "https://reddit.com/r/SaaS/comments/abc123",
    type: "post",
    matchedKeywords: ["analyze", "customer feedback", "tool"],
  },
  {
    id: "2",
    title: "Need help finding a Reddit monitoring solution",
    subreddit: "marketing",
    timestamp: "5 hours ago",
    content:
      "Does anyone know of a good tool to monitor Reddit for mentions of my brand? I've been doing it manually but it's too time-consuming.",
    relevanceScore: 98,
    agentId: "2",
    agentName: "Competitor Tracker",
    author: "marketingpro",
    url: "https://reddit.com/r/marketing/comments/def456",
    type: "post",
    matchedKeywords: ["monitor Reddit", "brand", "tool"],
  },
  {
    id: "3",
    title: "Frustrated with current analytics options",
    subreddit: "startups",
    timestamp: "1 day ago",
    content:
      "I've tried several analytics tools but none of them give me the insights I need for my specific industry. Anyone else facing this problem?",
    relevanceScore: 75,
    agentId: "1",
    agentName: "SaaS Product Monitor",
    author: "startupfounder",
    url: "https://reddit.com/r/startups/comments/ghi789",
    type: "post",
    matchedKeywords: ["analytics", "insights", "tools"],
  },
  {
    id: "4",
    title: "Best way to track competitor mentions?",
    subreddit: "EntrepreneurRideAlong",
    timestamp: "2 days ago",
    content:
      "What's the best way to track when competitors are mentioned on social media? Specifically interested in Reddit and Twitter.",
    relevanceScore: 88,
    agentId: "3",
    agentName: "Product Hunt Monitor",
    author: "growthmarketer",
    url: "https://reddit.com/r/EntrepreneurRideAlong/comments/jkl012",
    type: "post",
    matchedKeywords: ["track", "competitors", "Reddit"],
  },
  {
    id: "5",
    title: "How to find early adopters for B2B SaaS?",
    subreddit: "SaaS",
    timestamp: "3 days ago",
    content:
      "I'm struggling to find early adopters for my B2B SaaS product. Has anyone had success finding them on Reddit or other platforms?",
    relevanceScore: 85,
    agentId: "1",
    agentName: "SaaS Product Monitor",
    author: "b2bfounder",
    url: "https://reddit.com/r/SaaS/comments/mno345",
    type: "post",
    matchedKeywords: ["B2B SaaS", "early adopters", "Reddit"],
  },
  {
    id: "6",
    title: "Re: Need a tool for social listening",
    subreddit: "socialmedia",
    timestamp: "4 days ago",
    content:
      "I've been using Brand24 for this and it works pretty well for Reddit monitoring. Not perfect but better than manual searching.",
    relevanceScore: 78,
    agentId: "2",
    agentName: "Competitor Tracker",
    author: "socialexpert",
    url: "https://reddit.com/r/socialmedia/comments/pqr678/comment/abc123",
    type: "comment",
    matchedKeywords: ["tool", "Reddit monitoring", "social listening"],
  },
  {
    id: "7",
    title: "Anyone using AI for customer support?",
    subreddit: "CustomerSuccess",
    timestamp: "5 days ago",
    content:
      "We're looking to implement AI for our customer support workflow. Has anyone tried any good solutions that integrate with Zendesk?",
    relevanceScore: 82,
    agentId: "1",
    agentName: "SaaS Product Monitor",
    author: "customersuccess",
    url: "https://reddit.com/r/CustomerSuccess/comments/stu901",
    type: "post",
    matchedKeywords: ["AI", "customer support", "solutions"],
  },
  {
    id: "8",
    title: "Sentiment analysis tools recommendation",
    subreddit: "datascience",
    timestamp: "1 week ago",
    content:
      "Looking for a good sentiment analysis tool that can work across multiple platforms including Reddit. Any recommendations?",
    relevanceScore: 90,
    agentId: "3",
    agentName: "Product Hunt Monitor",
    author: "datascientist",
    url: "https://reddit.com/r/datascience/comments/vwx234",
    type: "post",
    matchedKeywords: ["sentiment analysis", "tool", "Reddit"],
  },
];

// Hardcoded data
export const recentResults: RecentResult[] = [
  {
    id: "1",
    title: "Looking for a tool to analyze customer feedback",
    subreddit: "SaaS",
    timestamp: "2 hours ago",
    content:
      "I'm looking for a tool that can help me analyze customer feedback from multiple sources. Any recommendations?",
    relevanceScore: 92,
    agentId: "1",
  },
  {
    id: "2",
    title: "Need help finding a Reddit monitoring solution",
    subreddit: "marketing",
    timestamp: "5 hours ago",
    content:
      "Does anyone know of a good tool to monitor Reddit for mentions of my brand? I've been doing it manually but it's too time-consuming.",
    relevanceScore: 98,
    agentId: "2",
  },
  {
    id: "3",
    title: "Frustrated with current analytics options",
    subreddit: "startups",
    timestamp: "1 day ago",
    content:
      "I've tried several analytics tools but none of them give me the insights I need for my specific industry. Anyone else facing this problem?",
    relevanceScore: 75,
    agentId: "1",
  },
  {
    id: "4",
    title: "Best way to track competitor mentions?",
    subreddit: "EntrepreneurRideAlong",
    timestamp: "2 days ago",
    content:
      "What's the best way to track when competitors are mentioned on social media? Specifically interested in Reddit and Twitter.",
    relevanceScore: 88,
    agentId: "3",
  },
  {
    id: "5",
    title: "How to find early adopters for B2B SaaS?",
    subreddit: "SaaS",
    timestamp: "3 days ago",
    content:
      "I'm struggling to find early adopters for my B2B SaaS product. Has anyone had success finding them on Reddit or other platforms?",
    relevanceScore: 85,
    agentId: "1",
  },
];

export const businessPatterns = [
  "i want to build",
  "i'm building a",
  "my startup idea is",
  "how to solve",
  "problem in",
  "business idea",
  "i am thinking to create",
  "i want to launch",
  "saas for",
  "platform for",
  "solution to",
  "need an idea for",
  "help with",
  "monetize",
  "i want to create",
  "how can i fix",
  "trying to solve",
  "building a tool for",
  "startup focused on",
  "an idea for",
  "creating a product to",
  "what’s a good way to solve",
  "i'm working on a",
  "idea validation for",
  "can i build a product for",
  "is there a market for",
  "is this a viable idea",
  "looking to automate",
  "want to simplify",
  "exploring a saas idea",
  "building an mvp for",
  "i have an idea for",
  "trying to build a solution for",
  "how to monetize",
  "business plan for",
  "targeting users who",
  "looking to solve a problem in",
  "thinking of launching",
  "need feedback on my idea",
  "early stage idea about",
  "developing a product for",
  "how to validate my idea",
  "pain point in",
  "want to disrupt",
  "solution i'm working on",
  "product idea around",
  "problem i noticed in",
  "trying to innovate in",
  "found a gap in",
  "customer need for",
  "building a platform to",
  "trying to make it easier to",
  "how to productize",
  "considering a tool that",
  "concept for a new",
  "new approach to",
];

export interface SubscriptionstatusProps {
  creationLimit: {
    canCreate: boolean;
    used: number;
    limit: number;
    tier: string;
    monitoringRequests: number;
    period: string;
  };
}

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: { name: string };
  subreddit: { display_name: string };
  permalink: string;
  score: number;
  created_utc: number;
}

export interface RedditComment {
  id: string;
  body: string;
  author: { name: string };
  score: number;
  created_utc: number;
}

export interface SubredditProps {
  id: string;
  name: string;
  title: string;
  description: string;
  subscribers: number;
  url: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}
