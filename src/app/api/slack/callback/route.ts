// app/api/slack/callback/route.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  console.log("fetched code",code)
  const session = await auth(); // your auth logic

  if (!code || !session?.user)
    return NextResponse.redirect(new URL("/?error=unauthorized", req.url));

  const res = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      redirect_uri: process.env.SLACK_REDIRECT_URI!,
    }),
  });

  const data = await res.json();
  if (!data.ok) return NextResponse.redirect(new URL("/?error=slack_oauth_failed", req.url));

  const { access_token, authed_user, team } = data;
  console.log("Access Token",access_token)
  console.log("Authed User",authed_user)
  console.log("Team",team)


  // Check if already connected
  const existing = await db
    .select({
      slackUserId: users.slackUserId,
      slackAccessToken: users.slackAccessToken,
      teamId: users.teamId,
    })
    .from(users)
    .where(
      and(
        eq(users.id, session.user.id),
        isNotNull(users.slackUserId),
        isNotNull(users.slackAccessToken),
        isNotNull(users.teamId)
      )
    ).limit(1);

  if (!existing || existing.length == 0) {
    await db.update(users).set({
      slackUserId: authed_user.id,
      slackAccessToken: access_token,
      teamId: team.id,
    }).where(eq(users.id, session.user.id));
  }

  return NextResponse.redirect(new URL("/agents?connected=slack", req.url));
}
