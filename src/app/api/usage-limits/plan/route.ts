// app/api/plan/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUsageOverview, canCreateAgent, isEmailVerified } from "@/lib/payments/check-subscriptions";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [canCreate, overview, verified] = await Promise.all([
    canCreateAgent(session.user.id),
    getUsageOverview(session.user.id),
    isEmailVerified(session.user.id),
  ]);
  return NextResponse.json({ canCreate, overview, verified });
}
