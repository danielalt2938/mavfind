import { NextRequest, NextResponse } from "next/server";
import {
  getPendingEmails,
  updateEmailStatus,
} from "@/lib/firebase/firestore";
import { sendNotificationEmail } from "@/lib/email/sendgrid";

// This endpoint should be called by a cron job (Vercel Cron)
// to process pending notification emails
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get pending emails (batch of 10)
    const pendingEmails = await getPendingEmails(10);

    const results = await Promise.allSettled(
      pendingEmails.map(async (emailJob) => {
        try {
          // Mark as processing
          await updateEmailStatus(emailJob.id, "processing");

          // Send email
          await sendNotificationEmail(emailJob.event);

          // Mark as sent
          await updateEmailStatus(emailJob.id, "sent");

          return { id: emailJob.id, status: "sent" };
        } catch (error) {
          console.error(`Error sending email ${emailJob.id}:`, error);

          // Mark as failed
          await updateEmailStatus(emailJob.id, "failed");

          return { id: emailJob.id, status: "failed", error };
        }
      })
    );

    const processed = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json(
      {
        success: true,
        processed,
        failed,
        total: pendingEmails.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error dispatching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
