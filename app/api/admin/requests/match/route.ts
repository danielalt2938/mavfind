import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import {
  updateRequestStatus,
  getRequest,
  getUser,
  enqueueEmail,
  updateLostItemStatus,
} from "@/lib/firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { requestId, lostItemId } = body;

    if (!requestId || !lostItemId) {
      return NextResponse.json(
        { error: "Request ID and Lost Item ID are required" },
        { status: 400 }
      );
    }

    // Get request to notify the owner
    const request = await getRequest(requestId);
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Update request status to matched
    await updateRequestStatus(requestId, "matched", lostItemId);

    // Update lost item status to matched
    await updateLostItemStatus(lostItemId, "matched");

    // Get owner email
    const owner = await getUser(request.ownerUid);
    if (owner) {
      await enqueueEmail({
        type: "request_status_update",
        recipientEmail: owner.email,
        data: {
          itemType: "request",
          itemId: requestId,
          status: "matched",
          description: request.description,
        },
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error matching request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
