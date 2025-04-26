import { db } from "@/lib/db";
import { agents, notifications, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/services/email";
import { sendWhatsAppMessage } from "@/lib/services/whatsapp";
import { createId } from "@paralleldrive/cuid2";

interface NotificationOptions {
  agentId: string;
  success: boolean;
  message: string;
  resultsCount?: number;
  processedSubreddits?: number;
  error?: string;
}

export async function sendRunNotification({
  agentId,
  message,
  success,
  error,
  processedSubreddits,
  resultsCount,
}: NotificationOptions): Promise<void> {
  try {
    // Get agent details
    const agent = await db.select().from(agents).where(eq(agents.id, agentId));

    if (!agent) {
      console.error(`Agent ${agentId} not found for notification`);
      return;
    }

    // Get user details
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, agent[0].userId));

    if (!user) {
      console.error(`User not found for agent ${agentId}`);
      return;
    }

    // Get notification preferences from agent configuration
    const notificationMethod =
      JSON.parse(agent[0].configuration).notificationMethod || "email";
    const whatsappNumber =
      JSON.parse(agent[0].configuration).whatsappNumber || "";

    // Prepare notification content
    const subject = success
      ? `Agent Run Completed: ${agent[0].name}`
      : `Agent Run Failed: ${agent[0].name}`;

    const content = success
      ? `Your agent "${agent[0].name}" has completed its run.\n\n` +
        `Results: ${resultsCount || 0} relevant items found across ${
          processedSubreddits || 0
        } subreddits.\n\n` +
        `${message}`
      : `Your agent "${agent[0].name}" encountered an error during its run.\n\n` +
        `Error: ${error || "Unknown error"}\n\n` +
        `${message}`;

    // Send notifications based on user preference
    if (notificationMethod === "email" || notificationMethod === "both") {
      if (user[0].email) {
        await sendEmail({
          to: user[0].email,
          subject,
          text: content,
          html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #FF8C00; padding: 20px; text-align: center; color: white;">
          <h1>Agent Run Completed</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
          <p>Hello ${user[0].name},</p>
          <p>${content.replace(/\n/g, "<br>")}</p>
          <div style="text-align: center; margin: 30px 0;">
          <a href="${
            process.env.NEXTAUTH_URL
          }/agents/${agentId}" style="background-color: #FF8C00; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
                  View Agent
          </a>
          </div>
          <p>Thanks,<br>The skroub Team</p>
        </div>
      </div>
            
          `,
        });
      }
    }

    if (notificationMethod === "whatsapp" || notificationMethod === "both") {
      if (whatsappNumber) {
        await sendWhatsAppMessage({
          to: whatsappNumber,
          message: `${subject}\n\n${content}`,
        });
      }
    }

        // Create notification record in the database
        const notificationId = createId()
        await db.insert(notifications).values({
          id: notificationId,
          userId: agent[0].userId,
          agentId: agentId,
          type: "agent", // You might want to create different types
          content: content,
          status: "sent", // Initial status
        })

    console.log(`Notification sent for agent ${agentId}`);
  } catch (error) {
    console.error(`Error sending run notification: ${error}`);
  }
}
