import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"

interface VerifyProps{
  params:Promise<{
  token:string,
  }>
}

export async function GET(request: Request, { params} :VerifyProps ) {
  try {
    const {token} = await params

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=InvalidToken", request.url))
    }

    // Find the token
    const verificationToken = await db.select().from(verificationTokens).where(eq(verificationTokens.token, token))

    if (!verificationToken || verificationToken.length ==0) {
      return NextResponse.redirect(new URL("/login?error=InvalidToken", request.url))
    }

    // Check if token is expired
    if (new Date() > verificationToken[0].expires) {
      // Delete expired token
      await db.delete(verificationTokens).where(eq(verificationTokens.token, token))

      return NextResponse.redirect(new URL("/login?error=ExpiredToken", request.url))
    }

    // Update user's email verification status
    await db.update(users).set({ emailVerified: new Date() }).where(eq(users.email, verificationToken[0].identifier))

    // Delete the token
    await db.delete(verificationTokens).where(eq(verificationTokens.token, token))

    return NextResponse.redirect(new URL("/login?verified=true", request.url))
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.redirect(new URL("/login?error=VerificationFailed", request.url))
  }
}

