import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { eq, and, ne } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Mark all unread notifications as read
    await db
      .update(notifications)
      .set({ status: "read" })
      .where(and(eq(notifications.userId, session.user.id), ne(notifications.status, "read")))

    return NextResponse.json({ message: "All notifications marked as read" }, { status: 200 })
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return NextResponse.json({ message: "An error occurred while updating notifications" }, { status: 500 })
  }
}
