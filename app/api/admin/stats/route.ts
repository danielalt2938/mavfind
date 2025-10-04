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

    const db = getFirestoreDb();

    // Get all requests
    let requestsQuery = db.collection("requests");
    if (locationId) {
      requestsQuery = requestsQuery.where("locationId", "==", locationId) as any;
    }
    const requestsSnapshot = await requestsQuery.get();

    // Get all found items
    let lostQuery = db.collection("lost");
    if (locationId) {
      lostQuery = lostQuery.where("locationId", "==", locationId) as any;
    }
    const lostSnapshot = await lostQuery.get();

    const requests = requestsSnapshot.docs.map((doc) => doc.data());
    const lostItems = lostSnapshot.docs.map((doc) => doc.data());

    const stats = {
      totalRequests: requests.length,
      pendingRequests: requests.filter((r: any) => r.status === "submitted")
        .length,
      approvedRequests: requests.filter((r: any) => r.status === "approved")
        .length,
      rejectedRequests: requests.filter((r: any) => r.status === "rejected")
        .length,
      totalFoundItems: lostItems.length,
      foundItems: lostItems.filter((i: any) => i.status === "found").length,
      claimedItems: lostItems.filter((i: any) => i.status === "claimed").length,
      archivedItems: lostItems.filter((i: any) => i.status === "archived")
        .length,
    };

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
