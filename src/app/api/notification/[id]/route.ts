import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"



interface configProps{
  params:Promise<{
    id:string,
    }>
}

export async function DELETE(request: Request, { params }: configProps) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const {id} = await params

    // Delete the notification
    const result = await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)))
      .returning({ id: notifications.id })

    if (!result || result.length === 0) {
      return NextResponse.json({ message: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Notification deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ message: "An error occurred while deleting the notification" }, { status: 500 })
  }
}
