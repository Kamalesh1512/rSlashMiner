import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { agents, usageLimits } from "@/lib/db/schema";


export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { agentId } = await req.json();

    await db.delete(agents).where(eq(agents.id, agentId));

    await db.update(usageLimits).set({
      agentCreationCount: Number(usageLimits.agentCreationCount) - 1
    }).where(eq(usageLimits.userId,session.user.id))

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update agent:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update agent configuration" },
      { status: 500 }
    );
  }
}
