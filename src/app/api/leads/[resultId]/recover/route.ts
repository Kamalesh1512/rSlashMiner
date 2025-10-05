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

    // Recover the archived lead
    const result = await db
      .update(monitoringResults)
      .set({
        isArchived: false,
        archivedAt: null,
      })
      .where(and(eq(monitoringResults.id, resultId), eq(monitoringResults.userId, session.user.id)));

    if (!result.rowCount) {
      return NextResponse.json({ message: "Lead not found or not archived" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Lead recovered successfully" });
  } catch (error) {
    console.error("Error recovering lead:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
