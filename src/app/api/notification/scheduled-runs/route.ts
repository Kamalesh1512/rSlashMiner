import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth"; // your own auth util
import { scheduledRuns } from "@/lib/db/schema";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // get scheduled Runs
    const runs = await db.select().from(scheduledRuns);

    if (runs.length == 0) {
      return NextResponse.json({ runs: [] }, { status: 200 });
    }

    return NextResponse.json({ runs: runs }, { status: 200 });
  } catch (error) {
    console.error("Error fetching agents scheduled runs:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching agents" },
      { status: 500 }
    );
  }
}
