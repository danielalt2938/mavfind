import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/server";
import { updateLostItemStatus } from "@/lib/firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { itemId, status } = body;

    if (!itemId || !status) {
      return NextResponse.json(
        { error: "Item ID and status are required" },
        { status: 400 }
      );
    }

    await updateLostItemStatus(itemId, status);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating item status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
