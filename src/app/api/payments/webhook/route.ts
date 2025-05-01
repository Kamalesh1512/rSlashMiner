import { Webhook } from "standardwebhooks";
import { NextResponse } from "next/server";
import { subscriptionService } from "@/lib/payments/subscription-service";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, isNotNull, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { WebhookPayload } from "@/lib/constants/types";
import { dodoClient } from "@/lib/payments/dodo-client";
import { getPlanByDodoId } from "@/lib/payments/subscription-plans";
import { createUsageLimitForUser } from "@/lib/payments/check-subscriptions/subscriptions";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const webhook = new Webhook(process.env.DODO_PAYMENTS_WEBHOOK_SECRET!);

  try {
    const session = await auth()
    const headersList = await headers();
    const rawBody = await request.text();

    const webhookHeaders = {
      "webhook-id": headersList.get("webhook-id") || "",
      "webhook-signature": headersList.get("webhook-signature") || "",
      "webhook-timestamp": headersList.get("webhook-timestamp") || "",
    };

    await webhook.verify(rawBody, webhookHeaders);
    const payload = JSON.parse(rawBody) as WebhookPayload;

    if (!payload.data?.customer?.email) {
      throw new Error("Missing customer email");
    }

        /// create subscription for a new user
        const plan = getPlanByDodoId(payload.data.product_id);
    
        const planTier = plan?.id.startsWith("starter")
        ? "starter"
        : plan?.id.startsWith("growth")
        ? "growth" : plan?.id.startsWith('enterprise')? "enterprise"
        : "free";
  
    // Handle different event types
    if (payload.data?.payload_type === "Subscription") {
      switch (payload.data.status) {
        case "active":
          console.log("Subscription updating");
          await subscriptionService.handleSubscription(payload.data);
          console.log("Paid User Index Updating...")
          await assignPaidUserIndexIfEligible(payload.data.customer.email)
          console.log("Updating the user Usage Limit based on new subscription plan")
          await createUsageLimitForUser(session?.user.id as string,planTier)
          return NextResponse.json(
            { message: "Webhook processed successfully" },
            { status: 200 }
          );

        case "cancelled":
          console.log("Cancelling the subscriptions");
          await subscriptionService.handleSubscriptionCanceled(payload.data);
          return NextResponse.json(
            { message: "Webhook processed successfully" },
            { status: 200 }
          );
        case "on_hold":
          console.log("subscriptions is On hold");
          await subscriptionService.handleSubscriptionUpdate(payload.data);
          return NextResponse.json(
            { message: "Webhook processed successfully" },
            { status: 200 }
          );
        case "failed":
          return NextResponse.json(
            { message: "Webhook processed Failed" },
            { status: 500 }
          );
      }
    } else {
      console.log("Inside else webhook");
      return NextResponse.json(
        { message: "Webhook processed successfully [Payment]" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { message: "An error occurred while processing the webhook" },
      { status: 500 }
    );
  }
}

// async function handlePaymentSucceeded(data: any) {
//   const { metadata } = data;

//   if (!metadata || !metadata.userId || !metadata.planId) {
//     console.error("Missing metadata in payment session");
//     return;
//   }

//   const { userId, planId } = metadata;

//   // Update user's subscription tier
//   const planTier = planId.startsWith("pro")
//     ? "pro"
//     : planId.startsWith("business")
//     ? "premium"
//     : "free";

//   await db
//     .update(users)
//     .set({
//       subscriptionTier: planTier,
//       // Set expiration date to 1 month or 1 year from now depending on the plan
//       subscriptionExpiresAt: new Date(
//         Date.now() +
//           (planId.includes("yearly") ? 365 : 30) * 24 * 60 * 60 * 1000
//       ),
//     })
//     .where(eq(users.id, userId));
// }

async function assignPaidUserIndexIfEligible(email: string) {
  // Check if the user already has a signup_index
  const existing = await db.select({ paidUser: users.paidUserIndex })
    .from(users)
    .where(eq(users.email, email));

  if (existing[0]?.paidUser !== null && existing[0]?.paidUser !== undefined) {
    return; // already assigned, no-op
  }

  // Count users who already have a signup_index
  const alreadyAssigned = await db
  .select({
    count: sql<number>`COUNT(*)`
  })
  .from(users)
  .where(isNotNull(users.paidUserIndex));

const count = alreadyAssigned[0]?.count ?? 0;

  if (count >= 25) {
    return; // limit reached, do not assign
  }

  // Assign the next signup_index
  await db.update(users)
    .set({ paidUserIndex: count + 1 })
    .where(eq(users.email, email));
}


