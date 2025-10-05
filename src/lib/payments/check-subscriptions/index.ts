//check-plan.ts
import { db } from "@/lib/db";
import { users, agents, agentKeywords, monitoringResults } from "@/lib/db/schema";
import { eq, and, gte, isNull, isNotNull, sql, inArray } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { planConfigType, planLimits } from "@/lib/constants/types";
import { auth } from "@/lib/auth";
import { shouldReset } from "@/lib/utils";

/**
 * Get user subscription plan
 */
export async function getUserPlan(userId?: string) {
  const session = await auth();
  const targetUserId = userId || session?.user?.id;
  
  if (!targetUserId) {
    return null;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId));

  if (!user) return null;

  const planTier = user.subscriptionTier;
  type Tier = keyof typeof planLimits;
  const plan = planLimits[planTier as Tier] as planConfigType;
  
  return { 
    plan, 
    planTier,
    user: {
      id: user.id,
      monthlyLeadsUsed: user.monthlyLeadsUsed,
      monthlyLeadLimit: user.monthlyLeadLimit,
      lastResetAt: user.lastResetAt,
      emailVerified: user.emailVerified
    }
  };
}

/**
 * Reset monthly usage if needed (first day of new month)
 */
export async function resetMonthlyUsageIfNeeded(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!user || !user.lastResetAt) return;

  const now = new Date();
  const lastReset = new Date(user.lastResetAt);
  
  // Check if we're in a new month
  const isNewMonth = 
    now.getMonth() !== lastReset.getMonth() || 
    now.getFullYear() !== lastReset.getFullYear();

  if (isNewMonth) {
    await db
      .update(users)
      .set({
        monthlyLeadsUsed: 0,
        lastResetAt: now,
      })
      .where(eq(users.id, userId));
  }
}

/**
 * Checks if a user can create a new agent based on their subscription tier
 */
export async function canCreateAgent(userId: string): Promise<{
  canCreate: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
}> {
  // Get user plan
  const planResult = await getUserPlan(userId);
  if (!planResult) {
    return { canCreate: false, reason: "Unable to fetch user plan" };
  }

  // Check email verification
  if (!planResult.user.emailVerified) {
    return { canCreate: false, reason: "Email not verified" };
  }

  // Count current active agents
  const [agentCountResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(agents)
    .where(eq(agents.userId, userId));

  const currentAgents = Number(agentCountResult?.count || 0);

  if (currentAgents >= planResult.plan.agent) {
    return {
      canCreate: false,
      reason: `Agent limit reached. Your plan allows ${planResult.plan.agent} agents.`,
      currentCount: currentAgents,
      limit: planResult.plan.agent
    };
  }

  return { 
    canCreate: true, 
    currentCount: currentAgents, 
    limit: planResult.plan.agent 
  };
}

/**
 * Check if user can add keywords to an agent
 */
export async function canAddKeywords(userId: string, keywordCount: number): Promise<{
  canAdd: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
}> {
  const planResult = await getUserPlan(userId);
  if (!planResult) {
    return { canAdd: false, reason: "Unable to fetch user plan" };
  }

  if (keywordCount > planResult.plan.keywords) {
    return {
      canAdd: false,
      reason: `Keyword limit exceeded. Your plan allows ${planResult.plan.keywords} keywords per agent.`,
      limit: planResult.plan.keywords
    };
  }

  return { canAdd: true, limit: planResult.plan.keywords };
}

/**
 * Check if user has monthly leads remaining
 */
export async function hasMonthlyLeadsRemaining(userId: string): Promise<{
  hasRemaining: boolean;
  reason?: string;
  used?: number;
  limit?: number;
}> {
  await resetMonthlyUsageIfNeeded(userId);
  
  const planResult = await getUserPlan(userId);
  if (!planResult) {
    return { hasRemaining: false, reason: "Unable to fetch user plan" };
  }

  const used = planResult.user.monthlyLeadsUsed;
  const limit = planResult.plan.monthlyLeads;

  if (limit === Infinity) {
    return { hasRemaining: true, used, limit };
  }

  if (used >= limit) {
    return {
      hasRemaining: false,
      reason: `Monthly lead limit reached (${used}/${limit}). Upgrade to track more leads.`,
      used,
      limit
    };
  }

  return { hasRemaining: true, used, limit };
}

/**
 * Check notification frequency permission
 */
export async function canUseNotificationFrequency(userId: string, frequency: string): Promise<{
  canUse: boolean;
  reason?: string;
  allowedFrequencies?: string[];
}> {
  const planResult = await getUserPlan(userId);
  if (!planResult) {
    return { canUse: false, reason: "Unable to fetch user plan" };
  }

  if (!planResult.plan.notificationFrequency.includes(frequency)) {
    return {
      canUse: false,
      reason: `Notification frequency '${frequency}' not allowed in your plan.`,
      allowedFrequencies: planResult.plan.notificationFrequency
    };
  }

  return { canUse: true, allowedFrequencies: planResult.plan.notificationFrequency };
}

/**
 * Get comprehensive usage overview for a user
 */
export async function getUsageOverview(userId: string) {
  await resetMonthlyUsageIfNeeded(userId);
  
  const planResult = await getUserPlan(userId);
  if (!planResult) return null;

  const planTier = planResult.planTier as keyof typeof planLimits;
  const limits = planLimits[planTier];

  // Get user agents
  const userAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.userId, userId));

  const agentsUsed = userAgents.length;

  // Count total keywords across all agents
  let totalKeywords = 0;
  if (userAgents.length > 0) {
    const [keywordResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(agentKeywords)
      .where(
        inArray(
          agentKeywords.agentId,
          userAgents.map((a) => a.id)
        )
      );
    totalKeywords = Number(keywordResult?.count || 0);
  }

  return {
    tier: planTier,
    agents: {
      used: agentsUsed,
      limit: limits.agent === Infinity ? "Unlimited" : limits.agent,
      canCreateMore: agentsUsed < limits.agent
    },
    keywords: {
      used: totalKeywords,
      limit: limits.keywords,
      maxPerAgent: limits.keywords
    },
    monthlyLeads: {
      used: planResult.user.monthlyLeadsUsed,
      limit: limits.monthlyLeads === Infinity ? "Unlimited" : limits.monthlyLeads,
      hasRemaining: limits.monthlyLeads === Infinity || planResult.user.monthlyLeadsUsed < limits.monthlyLeads
    },
    features: {
      notificationFrequencies: limits.notificationFrequency,
      alerts: limits.alerts,
      dataExport: limits.dataExport,
      autoReply: limits.autoReply,
      autoExecution: limits.autoExecution
    }
  };
}

/**
 * Increment monthly leads used
 */
export async function incrementMonthlyLeadsUsed(userId: string, count: number = 1) {
  await resetMonthlyUsageIfNeeded(userId);
  
  await db
    .update(users)
    .set({
      monthlyLeadsUsed: sql`${users.monthlyLeadsUsed} + ${count}`,
    })
    .where(eq(users.id, userId));
}

/**
 * Check if user's email is verified
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return !!user?.emailVerified;
}

/**
 * Get allowed alert channels for user's plan
 */
export async function allowedAlertChannels(userId?: string): Promise<string[]> {
  const planResult = await getUserPlan(userId);
  if (!planResult) return [];
  
  return planResult.plan.alerts || [];
}

/**
 * Check if user can export data
 */
export async function canExportData(userId?: string): Promise<boolean> {
  const planResult = await getUserPlan(userId);
  if (!planResult) return false;
  
  return !!planResult.plan.dataExport;
}

/**
 * Check if user can use auto reply feature
 */
export async function canUseAutoReply(userId?: string): Promise<boolean> {
  const planResult = await getUserPlan(userId);
  if (!planResult) return false;
  
  return !!planResult.plan.autoReply;
}

/**
 * Comprehensive validation for agent creation
 */
export async function validateAgentCreation(userId: string, agentData: {
  name: string;
  keywords: string[];
  platforms: string[];
  notificationFrequency: string;
}) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check basic requirements
  if (!agentData.name.trim()) {
    errors.push("Agent name is required");
  }

  if (agentData.keywords.length === 0) {
    errors.push("At least one keyword is required");
  }

  if (agentData.platforms.length === 0) {
    errors.push("At least one platform must be selected");
  }

  // Check plan limits
  const canCreate = await canCreateAgent(userId);
  if (!canCreate.canCreate) {
    errors.push(canCreate.reason || "Cannot create agent");
  }

  const canAddKw = await canAddKeywords(userId, agentData.keywords.length);
  if (!canAddKw.canAdd) {
    errors.push(canAddKw.reason || "Keyword limit exceeded");
  }

  const hasLeads = await hasMonthlyLeadsRemaining(userId);
  if (!hasLeads.hasRemaining) {
    warnings.push(hasLeads.reason || "Monthly lead limit reached");
  }

  const canUseFreq = await canUseNotificationFrequency(userId, agentData.notificationFrequency);
  if (!canUseFreq.canUse) {
    errors.push(canUseFreq.reason || "Invalid notification frequency");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    canProceed: errors.length === 0 // Can proceed even with warnings
  };
}