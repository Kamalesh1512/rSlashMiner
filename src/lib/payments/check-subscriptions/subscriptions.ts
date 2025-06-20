import { db } from "@/lib/db";
import { users, usageLimits, agents, keywords } from "@/lib/db/schema";
import { eq, and, gte, isNull, isNotNull, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { planConfigType, planLimits } from "@/lib/constants/types";
import { auth } from "@/lib/auth";
import { shouldReset } from "@/lib/utils";

/**
 * get user subscrtption plan
 */
export async function getUserPlan() {
  const session = await auth();
  if (!session || !session.user) {
    return "";
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id));

  const planTier = user[0].subscriptionTier;

  type Tier = keyof typeof planLimits;
  const plan = planLimits[planTier as Tier] as planConfigType;
  return { plan, planTier };
}

export async function createUsageLimitForUser(
  userId: string,
  plan: keyof typeof planLimits
) {
  const existingUsageLimit = await db
    .select()
    .from(usageLimits)
    .where(eq(usageLimits.userId, userId));

  if (existingUsageLimit.length == 0 || !existingUsageLimit) {
    await db.insert(usageLimits).values({
      userId,
      period: JSON.stringify({
        manualRunInterval: planLimits[plan].manualRuns.interval || "",
        scheduledRunInterval: planLimits[plan].scheduledRuns.interval || "",
      }),
      agentCreationCount: 0,
      keywordTrackCount: 0,
      manualRunCount: 0,
      scheduledRunCount: 0,
      lastResetAt: new Date(),
    });
  } else {
    await db
      .update(usageLimits)
      .set({
        period: JSON.stringify({
          manualRunInterval: planLimits[plan].manualRuns.interval || "",
          scheduledRunInterval: planLimits[plan].scheduledRuns.interval || "",
        }),
      })
      .where(eq(usageLimits.userId, userId));
  }
}

/**
 * reset usage function
 */
export async function resetUsageIfNeeded(userId: string) {
  const [limit] = await db
    .select()
    .from(usageLimits)
    .where(eq(usageLimits.userId, userId));

  if (!limit) return;

  if (shouldReset(limit.lastResetAt, limit.period)) {
    await db
      .update(usageLimits)
      .set({
        agentCreationCount: 0,
        keywordTrackCount: 0,
        manualRunCount: 0,
        scheduledRunCount: 0,
        lastResetAt: new Date(),
      })
      .where(eq(usageLimits.userId, userId));
  }
}

/**
 * Checks if a user can create a new agent based on their subscription tier
 */
export async function canCreateAgent(userId: string): Promise<boolean> {
  await resetUsageIfNeeded(userId);

  const planResult = await getUserPlan();
  if (!planResult) {
    return false;
  }
  const [usage] = await db
    .select()
    .from(usageLimits)
    .where(eq(usageLimits.userId, userId));

  const isVerified = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), isNotNull(users.emailVerified)))
    .limit(1);

  if (isVerified.length > 0) {
    return usage.agentCreationCount < planResult.plan.agent;
  }
  return false;
}

export async function isEmailVerified(userId: string): Promise<boolean> {
  const isVerified = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), isNotNull(users.emailVerified)))
    .limit(1);

  if (isVerified.length > 0) {
    return true;
  }
  return false;
}

export async function incrementAgentCount(userId: string) {
  await resetUsageIfNeeded(userId);

  // Fetch the current usage record
  const [record] = await db
    .select({ agentCreationCount: usageLimits.agentCreationCount })
    .from(usageLimits)
    .where(eq(usageLimits.userId, userId));

  const currentCount = Number(record?.agentCreationCount ?? 0);

  // Update with incremented value
  await db
    .update(usageLimits)
    .set({
      agentCreationCount: currentCount + 1,
    })
    .where(eq(usageLimits.userId, userId));
}

/**
 * Checks if a user can track more keywords based on their subscription tier
 */
export async function canTrackKeyword(userId: string): Promise<boolean> {
  await resetUsageIfNeeded(userId);

  const planResult = await getUserPlan();
  if (!planResult) {
    return false;
  }
  const [usage] = await db
    .select()
    .from(usageLimits)
    .where(eq(usageLimits.userId, userId));

  return usage.keywordTrackCount < planResult.plan.keywords;
}

export async function incrementKeywordCount(userId: string, count: number) {
  await resetUsageIfNeeded(userId);

  await db
    .update(usageLimits)
    .set({
      keywordTrackCount: sql`${usageLimits.keywordTrackCount} + ${count}`,
    })
    .where(eq(usageLimits.userId, userId));
}

/**
 * Checks if a user can manually run agent based on subscription tier - Currently not in use
 */
export async function canRunManually(userId: string): Promise<boolean> {
  await resetUsageIfNeeded(userId);

  const planResult = await getUserPlan();
  if (!planResult) {
    return false;
  }
  const [usage] = await db
    .select()
    .from(usageLimits)
    .where(eq(usageLimits.userId, userId));

  return usage.manualRunCount < planResult.plan.manualRuns.runCount;
}

export async function incrementManualRun(userId: string) {
  await resetUsageIfNeeded(userId);

  // Fetch the current usage record
  const [record] = await db
    .select({ agentManualRunCount: usageLimits.manualRunCount })
    .from(usageLimits)
    .where(eq(usageLimits.userId, userId));

  const currentCount = Number(record?.agentManualRunCount ?? 0);

  await db
    .update(usageLimits)
    .set({ manualRunCount: currentCount + 1})
    .where(eq(usageLimits.userId, userId));
}

export async function canScheduleRun(userId: string): Promise<boolean> {
  await resetUsageIfNeeded(userId);

  const planResult = await getUserPlan();
  if (!planResult) {
    return false;
  }
  const [usage] = await db
    .select()
    .from(usageLimits)
    .where(eq(usageLimits.userId, userId));

  return (
    planResult.plan.scheduledRuns.enabled &&
    usage.scheduledRunCount < planResult.plan.agent
  );
}

export async function incrementScheduledRun(userId: string) {
  await resetUsageIfNeeded(userId);

  await db
    .update(usageLimits)
    .set({ scheduledRunCount: sql`${usageLimits.scheduledRunCount} + 1` })
    .where(eq(usageLimits.userId, userId));
}

export async function allowedAlertChannels(): Promise<string[]> {
  const planResult = await getUserPlan();
  if (!planResult) {
    return [];
  }
  return planResult?.plan.alerts || [];
}

export async function canExportData(): Promise<boolean> {
  const planResult = await getUserPlan();
  if (!planResult) {
    return false;
  }
  return !!planResult?.plan.dataExport;
}

export async function canUseAutoReply(): Promise<boolean> {
  const planResult = await getUserPlan();
  if (!planResult) {
    return false;
  }
  return !!planResult?.plan.autoReply;
}

export async function getUsageOverview(userId: string) {
  const planResult = await getUserPlan();
  if (!planResult) {
    return null;
  }
  const limits = planResult.plan;

  // Reset if needed (optional here if handled elsewhere)
  await resetUsageIfNeeded(userId);

  const [usage] = await db
    .select({
      agentUsed: usageLimits.agentCreationCount,
      keywordUsed: usageLimits.keywordTrackCount,
      manualUsed: usageLimits.manualRunCount,
      scheduledUsed: usageLimits.scheduledRunCount,
    })
    .from(usageLimits)
    .where(eq(usageLimits.userId, userId));

  return {
    tier: planResult.planTier as string,
    agent: {
      used: usage.agentUsed,
      limit: limits.agent,
    },
    keywords: {
      used: usage.keywordUsed,
      limit: limits.keywords,
    },
    manualRuns: {
      used: usage.manualUsed,
      limit: limits.manualRuns.runCount,
      interval: limits.manualRuns.interval,
    },
    scheduledRuns: {
      used: usage.scheduledUsed,
      enabled: limits.scheduledRuns.enabled,
      interval: limits.scheduledRuns.interval,
      limit: limits.agent, // Assuming 1 scheduled run per agent max
    },
  };
}
