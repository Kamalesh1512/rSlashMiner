// /app/api/keywords/limit/route.ts (Next.js 13+ App Router)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth"; // your own auth util
import {
  canRunManually,
  getUserPlan,
  resetUsageIfNeeded,
} from "@/lib/payments/check-subscriptions/subscriptions";
import { usageLimits } from "@/lib/db/schema";
import { shouldReset } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session || !session.user.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [limit] = await db
    .select()
    .from(usageLimits)
    .where(eq(usageLimits.userId, session.user.id));

  if (!limit) return;

  if (
    shouldReset(limit.lastResetAt, JSON.parse(limit.period).manualRunInterval)
  ) {
    await db
      .update(usageLimits)
      .set({
        manualRunCount: 0,
        lastResetAt: new Date(),
      })
      .where(eq(usageLimits.userId, session.user.id));
  }

  const planResult = await getUserPlan();
  if (!planResult) {
    return NextResponse.json({ error: "Unable to fetch User Plan" }, { status: 404 });
  }

  const canRun = limit.manualRunCount < planResult.plan.manualRuns.runCount;

  if (!canRun)
    return NextResponse.json({
      manualRun: {
        canRun: canRun,
        runCount: planResult.plan.manualRuns.runCount,
        interval: planResult.plan.manualRuns.interval,
        type: planResult.plan.manualRuns.type,
      },
    });

  return NextResponse.json({
    manualRun: {
      canRun: canRun,
      runCount: planResult.plan.manualRuns.runCount,
      interval: planResult.plan.manualRuns.interval,
      type: planResult.plan.manualRuns.type,
    },
  });
}
