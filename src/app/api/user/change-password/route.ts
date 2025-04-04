import { NextResponse } from "next/server"
import { hash, compare } from "bcrypt"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "Current password and new password are required" }, { status: 400 })
    }

    // Get user with password
    const user = await db.select().from(users).where(eq(users.id, session.user.id))

    if (!user || !user[0].password) {
      return NextResponse.json({ message: "User not found or no password set" }, { status: 404 })
    }

    // Verify current password
    const isPasswordValid = await compare(currentPassword, user[0].password)

    if (!isPasswordValid) {
      return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 10)

    // Update the password
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, session.user.id))

    return NextResponse.json({ message: "Password changed successfully" }, { status: 200 })
  } catch (error) {
    console.error("Password change error:", error)
    return NextResponse.json({ message: "An error occurred while changing your password" }, { status: 500 })
  }
}

