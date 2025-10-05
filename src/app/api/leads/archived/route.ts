import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { monitoringResults } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, gt } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const leads = await db
      .select()
      .from(monitoringResults)
      .where(and(eq(monitoringResults.userId, session.user.id), eq(monitoringResults.isArchived, true)));

    return NextResponse.json({ success: true, leads });
  } catch (error) {
    console.error("Error fetching archived leads:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
