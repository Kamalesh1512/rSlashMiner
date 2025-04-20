import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ message: "Token and password are required" }, { status: 400 })
    }

    // Find the token
    const verificationToken = await db.select().from(verificationTokens).where(eq(verificationTokens.token, token))

    if (!verificationToken) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 })
    }

    // Check if token is expired
    if (new Date() > verificationToken[0].expires) {
      // Delete expired token
      await db.delete(verificationTokens).where(eq(verificationTokens.token, token))

      return NextResponse.json({ message: "Token has expired" }, { status: 400 })
    }

    // Find the user
    const user = await db.select().from(users).where(eq(users.email, verificationToken[0].identifier)).limit(1)

    if (!user || user.length==0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Hash the new password
    const hashedPassword = await hash(password, 10)

    // Update the user's password
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, user[0].id))

    // Delete the token
    await db.delete(verificationTokens).where(eq(verificationTokens.token, token))

    return NextResponse.json({ message: "Password reset successful" }, { status: 200 })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json({ message: "An error occurred while resetting your password" }, { status: 500 })
  }
}

