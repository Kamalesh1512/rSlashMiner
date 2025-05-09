import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notificationSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get notification settings for the user
    const settings = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, session.user.id))
      .limit(1)

    // If no settings exist, return default settings
    if (!settings || settings.length === 0) {
      return NextResponse.json(
        {
          settings: {
            email: true,
            whatsapp: false,
            slack: false,
            browser: true,
            whatsappNumber: "",
            slackWebhook: "",
            highRelevanceOnly: false,
            dailyDigest: true,
            digestTime: "09:00",
            notifyOnAgentCompletion: true,
            notifyOnScheduledRun: true,
            notifyOnAccountChanges: true,
            notifyOnSystemUpdates: true,
          },
        },
        { status: 200 },
      )
    }

    // Transform database settings to frontend format
    const userSettings = settings[0]
    return NextResponse.json(
      {
        settings: {
          email: userSettings.emailEnabled,
          slack: false, //userSettings.slackEnabled
          highRelevanceOnly: userSettings.minimumRelevanceScore > 70,
          dailyDigest: userSettings.dailyDigestEnabled,
          digestTime: userSettings.digestTime,
        //   notifyOnAgentCompletion: userSettings.notifyOnAgentCompletion || true,
        //   notifyOnScheduledRun: userSettings.notifyOnScheduledRun || true,
        //   notifyOnAccountChanges: userSettings.notifyOnAccountChanges || true,
        //   notifyOnSystemUpdates: userSettings.notifyOnSystemUpdates || true,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching notification settings:", error)
    return NextResponse.json({ message: "An error occurred while fetching notification settings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { settings } = await request.json()

    // Get existing settings
    const existingSettings = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, session.user.id))
      .limit(1)

    // Transform frontend settings to database format
    const dbSettings = {
      emailEnabled: settings.email,
      whatsappEnabled: settings.whatsapp,
      slackEnabled: settings.slack,
      browserEnabled: settings.browser,
      whatsappNumber: settings.whatsappNumber,
      slackWebhook: settings.slackWebhook,
      minimumRelevanceScore: settings.highRelevanceOnly ? 80 : 0,
      dailyDigestEnabled: settings.dailyDigest,
      digestTime: settings.digestTime,
      notifyOnAgentCompletion: settings.notifyOnAgentCompletion,
      notifyOnScheduledRun: settings.notifyOnScheduledRun,
      notifyOnAccountChanges: settings.notifyOnAccountChanges,
      notifyOnSystemUpdates: settings.notifyOnSystemUpdates,
      updatedAt: new Date(),
    }

    // If settings exist, update them
    if (existingSettings && existingSettings.length > 0) {
      await db.update(notificationSettings).set(dbSettings).where(eq(notificationSettings.userId, session.user.id))
    } else {
      // Otherwise, create new settings
      await db.insert(notificationSettings).values({
        id: createId(),
        userId: session.user.id,
        ...dbSettings,
        createdAt: new Date(),
      })
    }

    return NextResponse.json({ message: "Notification settings updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating notification settings:", error)
    return NextResponse.json({ message: "An error occurred while updating notification settings" }, { status: 500 })
  }
}
