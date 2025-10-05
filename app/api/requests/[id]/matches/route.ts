import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { id: requestId } = await params;

    // Verify the request belongs to the user
    const requestDoc = await adminDb.collection("requests").doc(requestId).get();
    if (!requestDoc.exists) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const requestData = requestDoc.data();
    if (requestData?.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch matches for this request
    const matchesSnapshot = await adminDb
      .collection("requests")
      .doc(requestId)
      .collection("matches")
      .orderBy("confidence", "desc")
      .get();

    const matches = [];
    for (const matchDoc of matchesSnapshot.docs) {
      const matchData = matchDoc.data();
      
      // Get the referenced lost item
      const lostItemDoc = await matchData.lostRef.get();
      if (lostItemDoc.exists) {
        const lostItemData = lostItemDoc.data();
        
        matches.push({
          id: matchDoc.id,
          confidence: matchData.confidence,
          distance: matchData.distance,
          rank: matchData.rank,
          status: matchData.status,
          createdAt: matchData.createdAt?.toDate()?.toISOString(),
          updatedAt: matchData.updatedAt?.toDate()?.toISOString(),
          lostItem: {
            id: lostItemDoc.id,
            ...lostItemData,
            createdAt: lostItemData.createdAt?.toDate()?.toISOString(),
            updatedAt: lostItemData.updatedAt?.toDate()?.toISOString(),
          }
        });
      }
    }

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}