import { NextResponse } from "next/server"
import { dodoPaymentsClient } from "@/lib/payments/dodo-client"
import { subscriptionService } from "@/lib/payments/subscription-service"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: Request) {
  try {
    // Get the raw request body
    const payload = await request.text()

    // Get the signature from headers
    const signature = request.headers.get("dodo-signature") || ""

    // Verify the webhook signature
    const isValid = dodoPaymentsClient.verifyWebhookSignature(payload, signature)

    if (!isValid) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 })
    }

    // Parse the event
    const event = JSON.parse(payload)

    // Handle different event types
    switch (event.type) {
      case "payment_session.succeeded":
        await handlePaymentSucceeded(event.data)
        break

      case "subscription.created":
      case "subscription.updated":
        await handleSubscriptionUpdated(event.data)
        break

      case "subscription.canceled":
        await handleSubscriptionCanceled(event.data)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ message: "An error occurred while processing the webhook" }, { status: 500 })
  }
}

async function handlePaymentSucceeded(data: any) {
  const { metadata } = data

  if (!metadata || !metadata.userId || !metadata.planId) {
    console.error("Missing metadata in payment session")
    return
  }

  const { userId, planId } = metadata

  // Update user's subscription tier
  const planTier = planId.startsWith("pro") ? "pro" : planId.startsWith("business") ? "premium" : "free"

  await db
    .update(users)
    .set({
      subscriptionTier: planTier,
      // Set expiration date to 1 month or 1 year from now depending on the plan
      subscriptionExpiresAt: new Date(Date.now() + (planId.includes("yearly") ? 365 : 30) * 24 * 60 * 60 * 1000),
    })
    .where(eq(users.id, userId))
}

async function handleSubscriptionUpdated(data: any) {
  const { id, status, current_period_end } = data

  await subscriptionService.handleSubscriptionUpdated(id, status, current_period_end)
}

async function handleSubscriptionCanceled(data: any) {
  const { id } = data

  // Find user with this subscription
  const user = await db.select().from(users).where(eq(users.dodoSubscriptionId as any, id))

  if (!user) {
    console.error(`No user found with subscription ID ${id}`)
    return
  }

  // Update user subscription status
  await db
    .update(users)
    .set({
      subscriptionTier: "free",
      dodoSubscriptionId: null,
      cancelAtPeriodEnd: false,
    })
    .where(eq(users.id, user[0].id))
}
