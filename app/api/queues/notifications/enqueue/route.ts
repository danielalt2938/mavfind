import { NextRequest, NextResponse } from "next/server";
import { enqueueEmail } from "@/lib/firebase/firestore";
import { NotificationEvent } from "@/types";

// This endpoint is for manually enqueuing notification events
// In production, this would be called by Firestore triggers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event: NotificationEvent = body;

    if (!event.type || !event.recipientEmail) {
      return NextResponse.json(
        { error: "Invalid notification event" },
        { status: 400 }
      );
    }

    const emailId = await enqueueEmail(event);

    return NextResponse.json({ success: true, emailId }, { status: 201 });
  } catch (error) {
    console.error("Error enqueuing notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
