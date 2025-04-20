import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { dodoPaymentsClient } from "./dodo-client"
import { getPlanById } from "./subscription-plans"

export interface CreateCheckoutOptions {
  planId: string
  userId: string
  successUrl: string
  cancelUrl: string
}

export interface SubscriptionStatus {
  active: boolean
  plan: string | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
}

export class SubscriptionService {
  /**
   * Create a checkout session for a subscription
   */
  async createCheckoutSession(options: CreateCheckoutOptions) {
    const { planId, userId, successUrl, cancelUrl } = options

    // Get the plan
    const plan = getPlanById(planId)
    if (!plan) {
      throw new Error(`Plan with ID ${planId} not found`)
    }

    // Get the user
    const user = await db.select().from(users).where(eq(users.id, userId))

    if (!user) {
      throw new Error(`User with ID ${userId} not found`)
    }

    // Create or get customer
    let customerId = user[0].dodoCustomerId as string | undefined

    if (!customerId) {
      const customer = await dodoPaymentsClient.createCustomer(user[0].email || "", user[0].name || undefined)
      console.log("DODO_RESPONSE_CATCH",customer)
      customerId = customer.customer_id

      // Update user with customer ID
      await db.update(users).set({ dodoCustomerId: customerId }).where(eq(users.id, userId))
    }

    // Create checkout session
    const session = await dodoPaymentsClient.createPaymentSession({
      amount: plan.price * 100, // Convert to cents
      currency: plan.currency,
      customerId,
      customerEmail: user[0].email || "",
      customerName: user[0].name || undefined,
      successUrl,
      cancelUrl,
      description: `Subscription to ${plan.name} plan`,
      metadata: {
        userId,
        planId,
      },
    })

    return session
  }

  /**
   * Get a user's subscription status
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    // Get the user
    const user = await db.select().from(users).where(eq(users.id, userId),)

    if (!user) {
      throw new Error(`User with ID ${userId} not found`)
    }

    // Default status for free tier
    if (user[0].subscriptionTier === "free") {
      return {
        active: true,
        plan: "free",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      }
    }

    // Return subscription status
    return {
      active: !!user[0].subscriptionTier && user[0].subscriptionTier !== "free",
      plan: user[0].subscriptionTier || null,
      currentPeriodEnd: user[0].subscriptionExpiresAt || null,
      cancelAtPeriodEnd: user[0].cancelAtPeriodEnd || false,
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(userId: string, cancelAtPeriodEnd = true) {
    // Get the user
    const user = await db.select().from(users).where(eq(users.id, userId))

    if (!user) {
      throw new Error(`User with ID ${userId} not found`)
    }

    if (!user[0].dodoSubscriptionId) {
      throw new Error("User does not have an active subscription")
    }

    // Cancel subscription with Dodo Payments
    await dodoPaymentsClient.cancelSubscription(user[0].dodoSubscriptionId, cancelAtPeriodEnd)

    // Update user record
    await db.update(users).set({ cancelAtPeriodEnd }).where(eq(users.id, userId))

    return { success: true }
  }

  /**
   * Update a user's subscription based on webhook event
   */
  async handleSubscriptionUpdated(subscriptionId: string, status: string, currentPeriodEnd: string) {
    // Find user with this subscription
    const user = await db.select().from(users).where(eq(users.dodoSubscriptionId as any, subscriptionId))

    if (!user) {
      console.error(`No user found with subscription ID ${subscriptionId}`)
      return
    }

    // Update user subscription status
    await db
      .update(users)
      .set({
        subscriptionTier: status === "active" ? user[0].subscriptionTier : "free",
        subscriptionExpiresAt: new Date(currentPeriodEnd),
      })
      .where(eq(users.id, user[0].id))
  }
}

// Create a singleton instance
export const subscriptionService = new SubscriptionService()
