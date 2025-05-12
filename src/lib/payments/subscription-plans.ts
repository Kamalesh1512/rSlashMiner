/**
 * Subscription plans configuration
 */

export interface SubscriptionPlan {
    id: string
    name: string
    description: string
    price: number
    msrpPrice: number
    currency: string
    interval: "month" | "year"
    features: string[]
    dodoPlanId: string[]
    popular?: boolean
  }
  
  export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
    free: {
      id: "free",
      name: "Free",
      description: "Perfect for getting started with AI agents",
      price: 0,
      msrpPrice: 0,
      currency: "USD",
      interval: "month",
      features: [
        "1 AI Agent",
        "Track up to 5 Keywords",
        "1 Manual Run per Week",
        "Email Notifications",
      ],
      dodoPlanId: ["free_plan"],
    },
    starter_monthly: {
      id: "starter_monthly",
      name: "Starter",
      description: "Ideal for professionals and early teams",
      price: 29,
      msrpPrice: 49,
      currency: "USD",
      interval: "month",
      features: [
        "2 AI Agents",
        "Track up to 10 Keywords",
        "Weekly Scheduled Runs per Agent",
        "Email & Slack Alerts",
      ],
      dodoPlanId: ["pdt_IrnUHW4QWCZRDDrKyJeeA","pdt_ufj9873AJ8ZKmmnr8KOze"],
      popular: true,
    },
    starter_yearly: {
      id: "starter_yearly",
      name: "Starter (Annual)",
      description: "Same great features at 40% off annually",
      price: 203,
      msrpPrice: 343,
      currency: "USD",
      interval: "year",
      features: [
        "2 AI Agents",
        "Track up to 10 Keywords",
        "Weekly Scheduled Runs per Agent",
        "Email & Slack Alerts",
      ],
      dodoPlanId: ["pdt_mPYyCxbiyAVuXrnYBJg0A","pdt_uDbl0jjVTAku6JPWovLbP"],
      popular: true,
    },
    growth_monthly: {
      id: "growth_monthly",
      name: "Growth",
      description: "Designed for fast-growing teams",
      price: 79,
      msrpPrice: 129,
      currency: "USD",
      interval: "month",
      features: [
        "5 AI Agents",
        "Track up to 25 Keywords",
        "Daily Scheduled Runs per Agent",
        "Email & Slack Alerts",
        "Auto-Reply System (Coming Soon)",
      ],
      dodoPlanId: ["pdt_EzwMoNOE7n1STFo0Ft1bj","pdt_r5ABWCZLE9aMqbKjb8zmk"],
    },
    growth_yearly: {
      id: "growth_yearly",
      name: "Growth (Annual)",
      description: "Scale affordably with 40% annual savings",
      price: 553,
      msrpPrice: 903,
      currency: "USD",
      interval: "year",
      features: [
        "5 AI Agents",
        "Track up to 25 Keywords",
        "Daily Scheduled Runs per Agent",
        "Email & Slack Alerts",
        "Auto-Reply System (Coming Soon)",
      ],
      dodoPlanId: ["pdt_TsaZG91XynAl7W3jAAaSl","pdt_1DaA4d6CVQoOpMVRUT5Hq"],
    },
    enterprise_monthly: {
      id: "enterprise_monthly",
      name: "Enterprise",
      description: "Powerful automation for high-scale operations",
      price: 119,
      msrpPrice: 199,
      currency: "USD",
      interval: "month",
      features: [
        "Unlimited AI Agents",
        "Track up to 100 Keywords",
        "Hourly Scheduled Runs per Agent",
        "Email & Slack Alerts",
        "Auto-Reply System (Coming Soon)",
      ],
      dodoPlanId: ["pdt_Z7b6xkD34iWSgEVkPn9Vo","pdt_Iq7yl2AhbKHe1ghHSjauQ"],
    },
    enterprise_yearly: {
      id: "enterprise_yearly",
      name: "Enterprise (Annual)",
      description: "Enterprise automation with unbeatable annual value",
      price: 799,
      msrpPrice: 1199,
      currency: "USD",
      interval: "year",
      features: [
        "Unlimited AI Agents",
        "Track up to 100 Keywords",
        "Hourly Scheduled Runs per Agent",
        "Email & Slack Alerts",
        "Auto-Reply System (Coming Soon)",
      ],
      dodoPlanId: ["pdt_fBc1m7BFxFLGgph7zQ1hJ",'pdt_kglftGzNI4MJ0KFBHadbL'],
    },
  };
  
  
  export function getPlanById(planId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS[planId]
  }

  export function getPlanByDodoId(dodoPlanId: string): SubscriptionPlan | undefined {
    return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.dodoPlanId.find((id)=> id == dodoPlanId));
  }
  
  export function getMonthlyPlans(): SubscriptionPlan[] {
    return Object.values(SUBSCRIPTION_PLANS).filter((plan) => plan.interval === "month" || plan.price === 0)
  }
  
  export function getYearlyPlans(): SubscriptionPlan[] {
    return Object.values(SUBSCRIPTION_PLANS).filter((plan) => plan.interval === "year" || plan.price === 0)
  }
  