import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/server";
import { getLocationLostItems } from "@/lib/firebase/firestore";
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

    // If locationId is provided, filter by location
    // Otherwise, return all items
    let items;
    if (locationId) {
      items = await getLocationLostItems(locationId);
    } else {
      // Fetch all lost items across all locations
      const db = getFirestoreDb();
      const snapshot = await db.collection("lost").orderBy("createdAt", "desc").get();
      items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error("Error fetching lost items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
