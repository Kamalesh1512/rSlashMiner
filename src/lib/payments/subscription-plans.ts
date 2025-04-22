/**
 * Subscription plans configuration
 */

export interface SubscriptionPlan {
    id: string
    name: string
    description: string
    price: number
    currency: string
    interval: "month" | "year"
    features: string[]
    dodoPlanId: string
    popular?: boolean
  }
  
  export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
    free: {
      id: "free",
      name: "Free",
      description: "For individuals just getting started",
      price: 0,
      currency: "USD",
      interval: "month",
      features: ["1 AI agent", "5 subreddit monitors", "Daily data updates", "Basic analytics", "Email notifications"],
      dodoPlanId: "free_plan",
    },
    pro_monthly: {
      id: "pro_monthly",
      name: "Pro",
      description: "For professionals and small teams",
      price: 14.99,
      currency: "USD",
      interval: "month",
      features: [
        "3 AI agents",
        "15 subreddit monitors",
        "Hourly data updates",
        "Advanced analytics",
        "Email & WhatsApp notifications",
        "Scheduled monitoring",
        "Data export",
      ],
      dodoPlanId: "pdt_MkIuemAtMWBYos90TI5cC",
      popular: true,
    },
    pro_yearly: {
      id: "pro_yearly",
      name: "Pro (Annual)",
      description: "For professionals and small teams",
      price: 152.90,
      currency: "USD",
      interval: "year",
      features: [
        "3 AI agents",
        "15 subreddit monitors",
        "Hourly data updates",
        "Advanced analytics",
        "Email & WhatsApp notifications",
        "Scheduled monitoring",
        "Data export",
      ],
      dodoPlanId: "pdt_uiKYUROaE9rWrjfdVvGq8",
      popular: true,
    },
    business_monthly: {
      id: "business_monthly",
      name: "Business",
      description: "For businesses with advanced needs",
      price: 49.99,
      currency: "USD",
      interval: "month",
      features: [
        "Unlimited AI agents",
        "Unlimited subreddit monitors",
        "Real-time data updates",
        "Enterprise analytics",
        "Priority support",
        "API access",
        "Custom integrations",
        "Team collaboration",
      ],
      dodoPlanId: "pdt_jxlCjttTwJEriDOtt9nU2",
    },
    business_yearly: {
      id: "business_yearly",
      name: "Business (Annual)",
      description: "For businesses with advanced needs",
      price: 509.90,
      currency: "USD",
      interval: "year",
      features: [
        "Unlimited AI agents",
        "Unlimited subreddit monitors",
        "Real-time data updates",
        "Enterprise analytics",
        "Priority support",
        "API access",
        "Custom integrations",
        "Team collaboration",
      ],
      dodoPlanId: "pdt_zKpK2gmevdKm85rrs5kz9",
    },
  }
  
  export function getPlanById(planId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS[planId]
  }

  export function getPlanByDodoId(dodoPlanId: string): SubscriptionPlan | undefined {
    return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.dodoPlanId === dodoPlanId);
  }
  
  export function getMonthlyPlans(): SubscriptionPlan[] {
    return Object.values(SUBSCRIPTION_PLANS).filter((plan) => plan.interval === "month" || plan.price === 0)
  }
  
  export function getYearlyPlans(): SubscriptionPlan[] {
    return Object.values(SUBSCRIPTION_PLANS).filter((plan) => plan.interval === "year" || plan.price === 0)
  }
  