export const dynamic = "force-dynamic";


import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { writeFile } from "fs/promises";
import path from "path";

export const POST = async (req: Request) => {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return new Response("No file uploaded", { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${session.user.id}-${Date.now()}.png`;
  const filePath = path.join(process.cwd(), "public/uploads", fileName);

  await writeFile(filePath, buffer);

  const imageUrl = `/uploads/${fileName}`;

  // Update in the database
  await db.update(users).set({ image: imageUrl }).where(eq(users.id, session.user.id));

  return new Response(JSON.stringify({ imageUrl }), { status: 200 });
};
