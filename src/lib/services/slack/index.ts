// lib/slack/sendSlackNotification.ts

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type SlackUser = {
  slackAccessToken: string; // bot token (xoxb-...)
  slackUserId: string; // the user's Slack ID
  slackDmChannelId?: string; // optional, cache for reuse
};

export async function sendSlackNotification(user: SlackUser, message: string) {
  const session = await auth();
  if (!session || !session.user.id) {
    console.error("❌ Anauthorised:");
    return false;
  }
  let channelId = user.slackDmChannelId;

  // Step 1: Open DM channel if not cached
  if (!channelId) {
    const openRes = await fetch("https://slack.com/api/conversations.open", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.slackAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ users: user.slackUserId }),
    });

    const openData = await openRes.json();
    if (!openData.ok) {
      console.error("❌ Failed to open Slack DM:", openData);
      return false;
    }

    channelId = openData.channel.id;

    // 🔄 Optional: save `channelId` to DB for next time
    await db
      .update(users)
      .set({ slackDmChannelId: channelId })
      .where(eq(users.id, session.user.id));
  }

  // Step 2: Send message
  const postRes = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${user.slackAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: channelId,
      text: message,
    }),
  });

  const postData = await postRes.json();
  if (!postData.ok) {
    console.error("❌ Failed to send Slack message:", postData);
    return false;
  }

  return true;
}
