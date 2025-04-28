import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {

    const allUsers = await db.select().from(users)

    if (!allUsers || allUsers.length ==0) {
      return NextResponse.json({ users: "No users Found" }, { status: 200 });
    }

    return NextResponse.json({ users: allUsers  }, { status: 200 });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching agents" },
      { status: 500 }
    );
  }
}