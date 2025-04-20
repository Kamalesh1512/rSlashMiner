import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { createId } from "@paralleldrive/cuid2"
import { sql } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const session = await auth()

    // Parse the request body
    const body = await request.json()
    const { rating, feedback, email, name, company, role, allowTestimonial, eventType, entityId } = body

    // Validate required fields
    if (!rating) {
      return NextResponse.json({ message: "Rating is required" }, { status: 400 })
    }

    // Create a unique ID for the feedback
    const feedbackId = createId()

    await db.insert(feedback).values({
        id: feedbackId,
        userId: session?.user?.id ?? null,
        rating: rating,
        feedbackText: feedback ?? null,
        email: email ?? null,
        name: name ?? null,
        company: company ?? null,
        role: role ?? null,
        allowTestimonial: allowTestimonial,
        isApproved: false, // requires admin approval
        eventType: eventType ?? null,
        entityId: entityId ?? null,
        createdAt: new Date(), // CURRENT_TIMESTAMP
      });
    return NextResponse.json({
      message: "Feedback submitted successfully",
      feedbackId,
    })
  } catch (error) {
    console.error("Error submitting feedback:", error)
    return NextResponse.json({ message: "An error occurred while submitting feedback" }, { status: 500 })
  }
}
