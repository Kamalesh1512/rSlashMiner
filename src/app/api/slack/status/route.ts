// app/api/slack/status/route.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";

import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ connected: false });

  try {
    const creds = await db
      .select({
        slackUserId: users.slackUserId,
        slackAccessToken: users.slackAccessToken,
        teamId: users.teamId,
      })
      .from(users)
      .where(
        and(
          eq(users.id, session.user.id),
          isNotNull(users.slackUserId),
          isNotNull(users.slackAccessToken),
          isNotNull(users.teamId)
        )
      )
      .limit(1);

    if (creds.length > 0) {
      return NextResponse.json({ connected: true });
    }
    return NextResponse.json({ connected: false });
  } catch (error) {
    console.error("Error checking the status", error);
    return NextResponse.json(
      { message: "An error occurred while fetching agents" },
      { status: 500 }
    );
  }
}
