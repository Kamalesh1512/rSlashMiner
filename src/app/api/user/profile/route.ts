export const dynamic = "force-dynamic";


import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { auth } from "@/lib/auth"

export async function PUT(request: Request) {
  try {
    const session = await auth()

    // console.log(session?.user)

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 })
    }

    // Update user profile
    await db.update(users).set({ name }).where(eq(users.id, session.user.id))

    return NextResponse.json({ message: "Profile updated successfully",user: {...session.user ,name} }, { status: 200 },)
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ message: "An error occurred while updating your profile" }, { status: 500 })
  }
}

