import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { updateUserNotificationPrefs } from "@/lib/firebase/firestore";
import { NotificationPreferences } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
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

    await updateUserNotificationPrefs((session.user as any).uid, prefs);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
