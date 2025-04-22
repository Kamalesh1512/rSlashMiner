import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { dodoClient } from "./dodo-client";
import { getPlanByDodoId, getPlanById } from "./subscription-plans";
import { WebhookPayload } from "../constants/types";

export interface CreateCheckoutOptions {
  planId: string;
  userId: string;
}

export interface SubscriptionStatus {
  active: boolean;
  plan: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export class SubscriptionService {
  /**
   * Create a checkout session for a subscription
   */
  async createCheckoutSession(options: CreateCheckoutOptions) {
    const { planId, userId } = options;

    // Get the plan
    const plan = getPlanById(planId);
    if (!plan) {
      throw new Error(`Plan with ID ${planId} not found`);
    }

    // Get the user
    const user = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Create or get customer
    let customerId = user[0].dodoCustomerId as string | undefined;

    if (!customerId) {
      const customer = await dodoClient.customers.create({
        email: user[0].email as string,
        name: user[0].name as string,
      });
      console.log("DODO_RESPONSE_CATCH", customer);
      customerId = customer.customer_id;

      // Update user with customer ID
      await db
        .update(users)
        .set({ dodoCustomerId: customerId })
        .where(eq(users.id, userId));
    }

    // Create checkout session
    const checkoutBaseUrl = process.env.DODO_PAYMENTS_CHECKOUT_URL;



    const productId = plan.dodoPlanId;
    const quantity = 1;
    const checkoutUrl = `${checkoutBaseUrl}/buy/${productId}?quantity=${quantity}&redirect_url=${process.env.NEXTAUTH_URL}/settings/subscription&email=${user[0].email}&disableEmail=true`;

    return checkoutUrl;
  }

  /**
   * Get a user's subscription status
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    // Get the user
    const user = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Default status for free tier
    if (user[0].subscriptionTier === "free") {
      return {
        active: true,
        plan: "free",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    // Return subscription status
    return {
      active: !!user[0].subscriptionTier && user[0].subscriptionTier !== "free",
      plan: user[0].subscriptionTier || null,
      currentPeriodEnd: user[0].subscriptionExpiresAt || null,
      cancelAtPeriodEnd: user[0].cancelAtPeriodEnd || false,
    };
  }

  /**
   * Cancel a subscription
   */
    async cancelSubscription(userId: string, cancelAtPeriodEnd = true) {
      // Get the user
      const user = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      if (!user[0].dodoSubscriptionId) {
        throw new Error("User does not have an active subscription");
      }

      // Cancel subscription with Dodo Payments
      await dodoClient.subscriptions.update(user[0].dodoSubscriptionId,
  {
            status:'cancelled',
        })

      // Update user record
      await db
        .update(users)
        .set({ cancelAtPeriodEnd })
        .where(eq(users.id, userId));

      return { success: true };
    }

  /**
   * Update a user's subscription based on webhook event
   */
  async handleSubscriptionUpdate(data:WebhookPayload['data']
  ) {
    // Find user with this subscription
    const user = await db
      .select()
      .from(users)
      .where(eq(users.dodoSubscriptionId as any, data.subscription_id));

    if (!user) {
      console.error(`No user found with subscription ID ${data.subscription_id}`);
      return;
    }

    // Update user subscription status
    const plan = getPlanByDodoId(data.product_id);
    await db
      .update(users)
      .set({
        subscriptionTier:
          data.status === "active" ? user[0].subscriptionTier : "free",
        subscriptionExpiresAt: new Date(
          Date.now() +
            (plan?.id.includes("yearly") ? 365 : 30) * 24 * 60 * 60 * 1000
        ),
      })
      .where(eq(users.id, user[0].id));
  }

  async handleSubscription(data: WebhookPayload["data"]) {
    // Find user with this subscription
    const user = await db
      .select()
      .from(users)
      .where(eq(users.dodoSubscriptionId, data.subscription_id as string));

      console.log("User found:",user)
    if (user.length>0) {
      console.log(
        `user already exists with subscription ID:${data.subscription_id}`
      );
      return;
    }

    if (!data.product_id) {
      console.error("Missing product_id in webhook response");
      return;
    }

    /// create subscription for a new user
    const plan = getPlanByDodoId(data.product_id);

    const planTier = plan?.id.startsWith("pro")
      ? "pro"
      : plan?.id.startsWith("business")
      ? "premium"
      : "free";

    // Update user subscription
    await db
      .update(users)
      .set({
        subscriptionTier: planTier,
        // Set expiration date to 1 month or 1 year from now depending on the plan
        subscriptionExpiresAt: new Date(
          Date.now() +
            (plan?.id.includes("yearly") ? 365 : 30) * 24 * 60 * 60 * 1000
        ),
      })
      .where(eq(users.email, data.customer.email));
  }

  async handleSubscriptionCanceled(data: any) {
    // Find user with this subscription
    const user = await db
      .select()
      .from(users)
      .where(eq(users.dodoSubscriptionId as any, data.subscription_id));

    if (!user) {
      console.error(
        `No user found with subscription ID ${data.subscription_id}`
      );
      return;
    }

    // Update user subscription status
    await db
      .update(users)
      .set({
        subscriptionTier: "free",
        dodoSubscriptionId: null,
        cancelAtPeriodEnd: false,
      })
      .where(eq(users.id, user[0].id));
  }
}

// Create a singleton instance
export const subscriptionService = new SubscriptionService();
