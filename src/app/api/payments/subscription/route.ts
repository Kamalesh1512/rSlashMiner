export const dynamic = "force-dynamic";


import { NextResponse } from "next/server"
import { subscriptionService } from "@/lib/payments/subscription-service"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Get the authenticated user
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get subscription status
    const status = await subscriptionService.getSubscriptionStatus(session.user.id)

    return NextResponse.json(status)
  } catch (error) {
    console.error("Error getting subscription status:", error)
    return NextResponse.json({ message: "An error occurred while getting subscription status" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    // Get the authenticated user
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const { cancelAtPeriodEnd } = await request.json()

    // Cancel subscription
    const result = await subscriptionService.cancelSubscription(session.user.id, cancelAtPeriodEnd)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error canceling subscription:", error)
    return NextResponse.json({ message: "An error occurred while canceling the subscription" }, { status: 500 })
  }
}
