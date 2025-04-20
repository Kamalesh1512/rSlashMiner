export const dynamic = "force-dynamic";



import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import { sendVerificationEmail } from "@/lib/services/email"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email))
    if (existingUser.length >0) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create user
    const userId = createId()
    await db.insert(users).values({
      id: userId,
      name,
      email,
      password: hashedPassword,
    })

    // Get the created user
    const newUser = await db.select().from(users).where(eq(users.id, userId))

    if (!newUser) {
      throw new Error("Failed to create user")
    }
        // Generate verification token
        const token = createId()
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    
        // Store the token
        await db.insert(verificationTokens).values({
          identifier: email,
          token,
          expires,
        })
    
        // Send verification email
        await sendVerificationEmail({
          to: email,
          token,
          username: name,
        })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser[0]

    return NextResponse.json({ message: "User created successfully", user: userWithoutPassword }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "An error occurred during registration" }, { status: 500 })
  }
}

