import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"
import { sendPasswordResetEmail } from "@/lib/services/email"


export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }

    // Check if user exists
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1)

    // Don't reveal if user exists or not for security reasons
    if (user.length==0 || !user) {
      return NextResponse.json(
        { message: "If an account with that email exists, we've sent a password reset link" },
        { status: 200 },
      )
    }

    // Generate a token
    const token = createId()
    const expires = new Date(Date.now() + 3600 * 1000) // 1 hour from now

    // Store the token
    await db.insert(verificationTokens).values({
      identifier: email,
      token,
      expires,
    })

    // Send email
    await sendPasswordResetEmail({
      to: email,
      token,
      username: user[0].name || email,
    })

    return NextResponse.json(
      { message: "If an account with that email exists, we've sent a password reset link" },
      { status: 200 },
    )
  } catch (error) {
    console.error("Password reset request error:", error)
    return NextResponse.json({ message: "An error occurred while processing your request" }, { status: 500 })
  }
}

