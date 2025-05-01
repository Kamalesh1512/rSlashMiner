
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth"; // adjust to your auth config
import { canCreateAgent } from "@/lib/payments/check-subscriptions/subscriptions";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await canCreateAgent(session.user.id);
  return NextResponse.json({data:result},{status:200});
}
