import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc, and, like, or, SQL, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = Number.parseInt(searchParams.get("limit") || "50");
    const offset = Number.parseInt(searchParams.get("offset") || "0");

    // Build query conditions
    const conditions = [
      eq(notifications.userId, session.user.id),
      type && eq(notifications.type, type),
      status && eq(notifications.status, status),
      search &&
        or(
          like(notifications.content, `%${search}%`)
          //   like(notifications.title, `%${search}%`)
        ),
    ].filter(Boolean) as SQL<unknown>[]; // remove undefined

    const query = and(...conditions);

    // Fetch notifications for the user
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(query)
      .orderBy(desc(notifications.sentAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(notifications)
      .where(query);

    return NextResponse.json(
      {
        notifications: userNotifications,
        total: count,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching notifications" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Delete all notifications for the user
    await db
      .delete(notifications)
      .where(eq(notifications.userId, session.user.id));

    return NextResponse.json(
      { message: "All notifications cleared successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return NextResponse.json(
      { message: "An error occurred while clearing notifications" },
      { status: 500 }
    );
  }
}
