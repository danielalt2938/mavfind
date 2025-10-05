import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase/admin";

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
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { id: requestId } = await params;

    // Verify the request belongs to the user
    const requestDoc = await db.collection("requests").doc(requestId).get();
    if (!requestDoc.exists) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const requestData = requestDoc.data();

    // Check both possible field names for user ID
    const requestUserId = requestData?.userId || requestData?.ownerUid;
    if (requestUserId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch matches for this request
    const matchesSnapshot = await db
      .collection("requests")
      .doc(requestId)
      .collection("matches")
      .orderBy("confidence", "desc")
      .get();

    const matches = [];
    for (const matchDoc of matchesSnapshot.docs) {
      const matchData = matchDoc.data();

      // Get the referenced lost item
      if (matchData.lostRef) {
        try {
          const lostItemDoc = await matchData.lostRef.get();
          if (lostItemDoc.exists) {
            const lostItemData = lostItemDoc.data();

            // Helper function to safely convert timestamps
            const toISOString = (timestamp: any) => {
              if (!timestamp) return undefined;
              if (timestamp instanceof Date) return timestamp.toISOString();
              if (typeof timestamp === "string") return timestamp;
              if (typeof timestamp?.toDate === "function")
                return timestamp.toDate().toISOString();
              return undefined;
            };

            matches.push({
              id: matchDoc.id,
              confidence: matchData.confidence,
              distance: matchData.distance,
              rank: matchData.rank,
              status: matchData.status,
              createdAt: toISOString(matchData.createdAt),
              updatedAt: toISOString(matchData.updatedAt),
              lostItem: {
                id: lostItemDoc.id,
                ...lostItemData,
                createdAt: toISOString(lostItemData.createdAt),
                updatedAt: toISOString(lostItemData.updatedAt),
              },
            });
          }
        } catch (error) {
          console.error(
            `Error fetching lost item for match ${matchDoc.id}:`,
            error
          );
        }
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
