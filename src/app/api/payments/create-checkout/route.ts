export const dynamic = "force-dynamic";


import { NextResponse } from "next/server"
import { auth, } from "@/lib/auth"
import { subscriptionService } from "@/lib/payments/subscription-service"

export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const { planId } = await request.json()

    if (!planId) {
      return NextResponse.json({ message: "Plan ID is required" }, { status: 400 })
    }

    // Get the base URL for success and cancel URLs
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

    // Create checkout session
    const checkoutSession = await subscriptionService.createCheckoutSession({
      planId,
      userId: session.user.id,
      successUrl: `${baseUrl}/settings/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/settings/subscription?canceled=true`,
    })

    return NextResponse.json({ checkoutUrl: checkoutSession.checkoutUrl })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ message: "An error occurred while creating the checkout session" }, { status: 500 })
  }
}
