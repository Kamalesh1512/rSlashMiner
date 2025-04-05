
import { NextResponse } from "next/server";
import { checkAgentCreationLimit } from "@/lib/check-subscriptions/subscriptions";
import { auth } from "@/lib/auth"; // adjust to your auth config

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await checkAgentCreationLimit(session.user.id);
  return NextResponse.json({data:result},{status:200});
}
