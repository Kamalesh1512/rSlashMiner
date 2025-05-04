// app/api/slack/start/route.ts
import { NextResponse } from "next/server"

export async function GET() {
  const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=chat:write,im:write,users:read&redirect_uri=${process.env.SLACK_REDIRECT_URI}`

  return NextResponse.redirect(slackAuthUrl)
}
