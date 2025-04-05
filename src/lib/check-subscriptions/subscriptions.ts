import { db } from "@/lib/db"
import { users, usageLimits } from "@/lib/db/schema"
import { eq, and, gte } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"

// Define subscription tiers and their limits
const SUBSCRIPTION_LIMITS = {
  free: {
    agentCreationLimit: 1,
    agentCreationPeriod: "monthly", // Free tier: 1 agent per month
    monitoringRequestsLimit: 50, // Reduced from 100 to 50
  },
  pro: {
    agentCreationLimit: 1, // Changed from 3 to 1 per day
    agentCreationPeriod: "daily",
    monitoringRequestsLimit: 250, // Reduced from 500 to 250
  },
  premium: {
    agentCreationLimit: Number.POSITIVE_INFINITY,
    agentCreationPeriod: "none", // No limit
    monitoringRequestsLimit: Number.POSITIVE_INFINITY,
  },
}

/**
 * Checks if a user can create a new agent based on their subscription tier
 */
export async function checkAgentCreationLimit(userId: string) {
  // Get user's subscription tier
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (!user || user.length === 0) {
    throw new Error("User not found")
  }

  const tier = user[0].subscriptionTier || "free"
  const tierConfig = SUBSCRIPTION_LIMITS[tier as keyof typeof SUBSCRIPTION_LIMITS]
  const limit = tierConfig.agentCreationLimit
  const period = tierConfig.agentCreationPeriod

  // Get the start date based on the period
  const startDate = new Date()
  if (period === "daily") {
    startDate.setHours(0, 0, 0, 0) // Start of today
  } else if (period === "monthly") {
    startDate.setDate(1) // Start of current month
    startDate.setHours(0, 0, 0, 0)
  }

  // Check if user has a usage record for the current period
  let usageRecord = await db
    .select()
    .from(usageLimits)
    .where(and(eq(usageLimits.userId, userId), eq(usageLimits.period, period), gte(usageLimits.lastResetAt, startDate)))

  // If no record exists for the current period, create one
  if (usageRecord.length === 0) {
    const id = createId()
    await db.insert(usageLimits).values({
      id,
      userId,
      period: period,
      agentCreationCount: 0,
      monitoringRequestCount: 0,
      lastResetAt: new Date(),
    })

    usageRecord = await db.select().from(usageLimits).where(eq(usageLimits.id, id))

    if (!usageRecord || usageRecord.length === 0) {
      throw new Error("Failed to create usage record")
    }
  }

  // Check if user has reached their limit
  const canCreate = usageRecord[0].agentCreationCount < limit

  return {
    canCreate,
    used: usageRecord[0].agentCreationCount,
    limit,
    tier,
    period,
  }
}

/**
 * Increments the agent creation count for a user
 */
export async function incrementAgentCreationCount(userId: string) {
  // Get user's subscription tier
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (!user || user.length === 0) {
    throw new Error("User not found")
  }

  const tier = user[0].subscriptionTier || "free"
  const period = SUBSCRIPTION_LIMITS[tier as keyof typeof SUBSCRIPTION_LIMITS].agentCreationPeriod

  // Get the start date based on the period
  const startDate = new Date()
  if (period === "daily") {
    startDate.setHours(0, 0, 0, 0) // Start of today
  } else if (period === "monthly") {
    startDate.setDate(1) // Start of current month
    startDate.setHours(0, 0, 0, 0)
  }

  // Check if user has a usage record for the current period
  const usageRecord = await db
    .select()
    .from(usageLimits)
    .where(and(eq(usageLimits.userId, userId), eq(usageLimits.period, period), gte(usageLimits.lastResetAt, startDate)))

  // If no record exists for the current period, create one
  if (!usageRecord || usageRecord.length === 0) {
    const id = createId()
    await db.insert(usageLimits).values({
      id,
      userId,
      period: period,
      agentCreationCount: 1, // Start at 1 since we're creating an agent
      monitoringRequestCount: 0,
      lastResetAt: new Date(),
    })
  } else {
    // Increment the count
    await db
      .update(usageLimits)
      .set({
        agentCreationCount: usageRecord[0].agentCreationCount + 1,
      })
      .where(eq(usageLimits.id, usageRecord[0].id))
  }
}

