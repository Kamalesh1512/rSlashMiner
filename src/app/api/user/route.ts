import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {

    const allPaidUsers = await db.select().from(users).where(isNotNull(users.paidUserIndex))

    if (!allPaidUsers) {
      return NextResponse.json({ users: "No users Found" }, { status: 200 });
    }

    return NextResponse.json({ users: allPaidUsers  }, { status: 200 });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching agents" },
      { status: 500 }
    );
  }
}