import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { and, desc, eq, isNotNull, sql } from "drizzle-orm"
import { feedback, users } from "@/lib/db/schema"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const featured = searchParams.get("featured") === "true"

    const baseConditions = and(
        eq(feedback.allowTestimonial, true),
        eq(feedback.isApproved, true),
        isNotNull(feedback.feedbackText),
        ...(featured ? [eq(feedback.isFeatured, true)] : [])
      );
      
      const testimonials = await db
        .select({
          id: feedback.id,
          name: feedback.name,
          company: feedback.company,
          role: feedback.role,
          rating: feedback.rating,
          text: feedback.feedbackText,
          createdAt: feedback.createdAt,
          avatar: users.image,
        })
        .from(feedback)
        .leftJoin(users, eq(feedback.userId, users.id))
        .where(baseConditions)
        .orderBy(
          featured ? feedback.featuredOrder : desc(feedback.createdAt)
        )
        .limit(limit);

    return NextResponse.json(testimonials)
  } catch (error) {
    console.error("Error fetching testimonials:", error)
    return NextResponse.json({ message: "An error occurred while fetching testimonials" }, { status: 500 })
  }
}
