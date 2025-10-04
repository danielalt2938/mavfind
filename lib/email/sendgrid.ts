import sgMail from "@sendgrid/mail";
import { NotificationEvent } from "@/types";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@mavfind.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export async function sendNotificationEmail(event: NotificationEvent) {
  const { type, recipientEmail, data } = event;

  let subject = "";
  let html = "";

  switch (type) {
    case "new_lost_item":
      subject = "New Found Item Matching Your Preferences";
      html = `
        <h2>New Found Item</h2>
        <p>A new item has been found that matches your notification preferences:</p>
        <ul>
          <li><strong>Description:</strong> ${data.description || "N/A"}</li>
          <li><strong>Location:</strong> ${data.locationName || "N/A"}</li>
        </ul>
        <p><a href="${APP_URL}/inventory">View Inventory</a></p>
      `;
      break;

    case "request_status_update":
      subject = "Update on Your Lost Item Report";
      html = `
        <h2>Lost Item Report Update</h2>
        <p>Your lost item report has been updated:</p>
        <ul>
          <li><strong>Status:</strong> ${data.status || "N/A"}</li>
          <li><strong>Description:</strong> ${data.description || "N/A"}</li>
        </ul>
        <p><a href="${APP_URL}/dashboard/user">View Your Reports</a></p>
      `;
      break;

    case "admin_alert":
      subject = "New Lost Item Report";
      html = `
        <h2>New Lost Item Report</h2>
        <p>A new lost item has been reported:</p>
        <ul>
          <li><strong>Description:</strong> ${data.description || "N/A"}</li>
          <li><strong>Location:</strong> ${data.locationName || "N/A"}</li>
        </ul>
        <p><a href="${APP_URL}/dashboard/admin">Review in Admin Dashboard</a></p>
      `;
      break;

    default:
      throw new Error(`Unknown notification type: ${type}`);
  }

  return sendEmail(recipientEmail, subject, html);
}
