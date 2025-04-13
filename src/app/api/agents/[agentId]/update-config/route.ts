import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { agents } from "@/lib/db/schema";


export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { configuration, isActive } = await req.json();

    // Extract the agentId from the URL
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const agentId = segments[segments.length - 2]; // assumes route is .../agents/[agentId]/update-config

    await db
      .update(agents)
      .set({
        configuration,
        isActive,
        updatedAt:new Date()
      })
      .where(eq(agents.id, agentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update agent:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update agent configuration" },
      { status: 500 }
    );
  }
}
