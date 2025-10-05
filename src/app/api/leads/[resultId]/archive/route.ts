import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { monitoringResults } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

interface LeadParams {
  params: Promise<{ resultId: string }>;
}

export async function POST(req: Request, { params }: LeadParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { resultId } = await params;

    // Check if lead exists and belongs to user
    const lead = await db
      .select()
      .from(monitoringResults)
      .where(and(eq(monitoringResults.id, resultId), eq(monitoringResults.userId, session.user.id)))
      .limit(1);

    if (!lead.length) {
      return NextResponse.json({ message: "Lead not found" }, { status: 404 });
    }

    // Mark lead as archived
    await db
      .update(monitoringResults)
      .set({
        isArchived: true,
        archivedAt: new Date(),
      })
      .where(and(eq(monitoringResults.id, resultId), eq(monitoringResults.userId, session.user.id)));

    return NextResponse.json({ success: true, message: "Lead archived successfully" });
  } catch (error) {
    console.error("Error archiving lead:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
