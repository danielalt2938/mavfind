import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/server";
import { updateUserNotificationPrefs } from "@/lib/firebase/firestore";
import { NotificationPreferences } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { categories, locations, frequency } = body;

    if (!categories || !locations || !frequency) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prefs: NotificationPreferences = {
      categories,
      locations,
      frequency,
    };

    await updateUserNotificationPrefs(user.uid, prefs);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
