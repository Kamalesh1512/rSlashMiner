import {
  LayoutDashboard,
  Bot,
  Search,
  Bell,
  Settings,
  HelpCircle,
  BarChart3,
  Clock,
} from "lucide-react";

import { Payment as BasePayment } from "dodopayments/resources/payments.mjs";
import { Subscription as BaseSubscription } from "dodopayments/resources/subscriptions.mjs";
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
    name: "Agents",
    href: "/agents",
    icon: Bot,
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },

  {
    name: "Results",
    href: "/results",
    icon: BarChart3,
  },
  {
    name: "Monitoring",
    href: "/monitoring",
    icon: Clock,
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
    agentId: string;
    author:string | null,
    content:string,
    createdAt:Date,
    processed:boolean,
    redditCommentId:string,
    redditPostId:string,
    subreddit: string;
    relevanceScore: number;
    score:number,
    sentimentScore:number,
    url:string,
    matchedKeywords:string[],
    type?:'post' | 'comment'
  }[];
}

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

type Day =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const weekDays: Day[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];



export type Payment = BasePayment & { payload_type: string , product_id:string };
export type Subscription = BaseSubscription & { payload_type: string,product_id:string};

export type OneTimeProduct = {
  product_id: string;
  quantity: number;
};

export type SubscriptionDetails = {
  activated_at: string;
  subscription_id: string;
  payment_frequency_interval: 'Day' | 'Week' | 'Month' | 'Year';
  product_id: string;
};

export type WebhookPayload = {
  type: string;
  data: Payment | Subscription
};


export interface FaqItem {
  id: string
  question: string
  answer: string
  category: "general" | "agents" | "billing" | "technical"
}

export const faqs: FaqItem[] = [
  {
    id: "1",
    question: "What is Skroub?",
    answer:
      "Skroub is a Reddit monitoring tool that helps businesses identify potential customers, track market trends, and gather insights from Reddit communities. It uses AI to analyze Reddit content and notify you when relevant discussions are happening.",
    category: "general",
  },
  {
    id: "2",
    question: "How do agents work?",
    answer:
      "Agents are automated monitors that track specific subreddits for keywords and phrases you define. Each agent can monitor multiple subreddits and track multiple keywords. When a match is found, the agent analyzes the content for relevance to your business and notifies you based on your notification settings.",
    category: "agents",
  },
  {
    id: "3",
    question: "Is Skroub compliant with Reddit's terms of service?",
    answer:
      "Yes, Skroub operates within Reddit's API guidelines and terms of service. We respect rate limits and follow all required policies to ensure ethical data collection.",
    category: "general",
  },
  {
    id: "4",
    question: "How accurate is the sentiment analysis?",
    answer:
      "Our sentiment analysis uses advanced NLP models with an accuracy rate of over 85%. We continuously train and improve our models to better understand Reddit's unique language patterns and context.",
    category: "technical",
  },
  {
    id: "5",
    question: "Can I export the data for use in other tools?",
    answer:
      "Yes, Pro and Premium plans include data export functionality in CSV, JSON, and Excel formats, making it easy to integrate with your existing workflows and tools.",
    category: "technical",
  },
  {
    id: "6",
    question: "How far back does the historical data go?",
    answer:
      "Free plans provide data from the past 30 days. Pro plans extend to 6 months, and Premium plans offer up to 2 years of historical data, subject to Reddit's API limitations.",
    category: "technical",
  },
  {
    id: "7",
    question: "How do I upgrade my subscription?",
    answer:
      "You can upgrade your subscription by going to Settings > Subscription and selecting the plan that best fits your needs. You can pay via credit card",
    category: "billing",
  },
  {
    id: "8",
    question: "What's the difference between the subscription tiers?",
    answer:
      "Free tier includes basic monitoring with 1 agent and 3 monitoring requests per day. Pro tier ($14.99/month) includes 3 agents, 10 requests per day, and additional features like data export and advanced analytics. Premium tier ($49.99/month) includes unlimited agents, unlimited requests, and all premium features.",
    category: "billing",
  },
  {
    id: "9",
    question: "How do I create a new agent?",
    answer:
      "To create a new agent, go to the Agents page and click 'Create Agent'. Follow the step-by-step process to define your business details, select subreddits to monitor, add keywords, and set up notification preferences.",
    category: "agents",
  },
  {
    id: "10",
    question: "Can I pause an agent temporarily?",
    answer:
      "Yes, you can pause and resume agents at any time. When paused, the agent will stop monitoring and won't use your daily monitoring requests.",
    category: "agents",
  },
]