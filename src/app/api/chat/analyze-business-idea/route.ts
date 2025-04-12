// import { auth } from "@/lib/auth";
// import { NextResponse } from "next/server";

// export async function POST(request: Request) {
//   try {
//     const session = await auth();

//     if (!session || !session.user) {
//       return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//     }

//     const { chatInput } = await request.json();

    

//     return NextResponse.json(
//       { message: "Agent created successfully", agentId },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Error creating agent:", error);
//     return NextResponse.json(
//       { message: "An error occurred while creating the agent" },
//       { status: 500 }
//     );
//   }
// }
