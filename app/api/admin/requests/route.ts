import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/server";
import { getFirestoreDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const status = searchParams.get("status");

    const db = getFirestoreDb();
    let query = db.collection("requests");

    // Filter by location if provided
    if (locationId) {
      query = query.where("locationId", "==", locationId) as any;
    }

    // Filter by status if provided
    if (status) {
      query = query.where("status", "==", status) as any;
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();

    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
