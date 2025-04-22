import { Webhook } from "standardwebhooks";
import { NextResponse } from "next/server";
import { subscriptionService } from "@/lib/payments/subscription-service";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { WebhookPayload } from "@/lib/constants/types";
import { dodoClient } from "@/lib/payments/dodo-client";
import { getPlanByDodoId } from "@/lib/payments/subscription-plans";

export async function POST(request: Request) {
  const webhook = new Webhook(process.env.DODO_PAYMENTS_WEBHOOK_SECRET!);

  try {
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

    // Handle different event types
    if (payload.data?.payload_type === "Subscription") {
      switch (payload.data.status) {
        case "active":
          console.log("Subscription updating");
          await subscriptionService.handleSubscription(payload.data);
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

async function handlePaymentSucceeded(data: any) {
  const { metadata } = data;

  if (!metadata || !metadata.userId || !metadata.planId) {
    console.error("Missing metadata in payment session");
    return;
  }

  const { userId, planId } = metadata;

  // Update user's subscription tier
  const planTier = planId.startsWith("pro")
    ? "pro"
    : planId.startsWith("business")
    ? "premium"
    : "free";

  await db
    .update(users)
    .set({
      subscriptionTier: planTier,
      // Set expiration date to 1 month or 1 year from now depending on the plan
      subscriptionExpiresAt: new Date(
        Date.now() +
          (planId.includes("yearly") ? 365 : 30) * 24 * 60 * 60 * 1000
      ),
    })
    .where(eq(users.id, userId));
}


