import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateAgentCreation } from "@/lib/payments/check-subscriptions";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid or empty JSON body" },
        { status: 400 }
      );
    }

    // Defensive checks
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be an object" },
        { status: 400 }
      );
    }

    const result = await validateAgentCreation(session.user.id, body);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in validate-agent API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
