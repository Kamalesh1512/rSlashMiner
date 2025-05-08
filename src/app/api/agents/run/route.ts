// app/api/agents/runs/route.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { runHistory } from "@/lib/db/schema";

import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const runs = await db
    .select()
    .from(runHistory)
    .where(eq(runHistory.userId, session.user.id))
    .orderBy(runHistory.startedAt);

  return Response.json({ runs });
}