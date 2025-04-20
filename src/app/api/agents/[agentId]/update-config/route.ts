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

    const { configuration, isActive,agentId } = await req.json();

    console.log(configuration)
    console.log(isActive)
    console.log(agentId)


    if (!agentId || !configuration || !isActive) {
      return NextResponse.json(
        { success: false, message: "Missing Fields Required" },
        { status: 401 });
    }
    
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
