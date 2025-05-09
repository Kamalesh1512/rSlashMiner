import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const id = params.id

    // Mark the notification as read
    const result = await db
      .update(notifications)
      .set({ status: "read" })
      .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)))
      .returning({ id: notifications.id })

    if (!result || result.length === 0) {
      return NextResponse.json({ message: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Notification marked as read" }, { status: 200 })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json({ message: "An error occurred while updating the notification" }, { status: 500 })
  }
}
