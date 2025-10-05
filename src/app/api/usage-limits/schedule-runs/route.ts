
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth, } from "@/lib/auth"; // your own auth util
// import { usageLimits } from "@/lib/db/schema";
import { getUserPlan } from "@/lib/payments/check-subscriptions";

export async function GET() {
  const session = await auth();
  if (!session || !session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planResult = await getUserPlan();
  if (!planResult) return NextResponse.json({ max: 0, used: 0 });
  const scheduledRuns = true

  return NextResponse.json({ scheduledRuns });
}
