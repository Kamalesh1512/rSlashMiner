import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { agents } from "@/lib/db/schema";

interface configProps{
  params:Promise<{
    agentId:string,
    }>
}


export async function POST(req: NextRequest,{params}:configProps) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { configuration, isActive } = await req.json();

    const {agentId} = await params
    

    await db
      .delete(agents) 
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