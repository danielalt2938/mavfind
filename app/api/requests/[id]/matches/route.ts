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
      console.log(`Request not found: ${requestId}`);
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const requestData = requestDoc.data();
    console.log(`Request data for ${requestId}:`, {
      userId: requestData?.userId,
      ownerUid: requestData?.ownerUid,
      currentUserId: userId
    });
    
    // Check both possible field names for user ID
    const requestUserId = requestData?.userId || requestData?.ownerUid;
    if (requestUserId !== userId) {
      console.log(`Authorization failed: request user ${requestUserId} !== current user ${userId}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch matches for this request
    console.log(`Fetching matches for request: ${requestId}`);
    const matchesSnapshot = await db
      .collection("requests")
      .doc(requestId)
      .collection("matches")
      .orderBy("confidence", "desc")
      .get();

    console.log(`Found ${matchesSnapshot.size} match documents`);

    const matches = [];
    for (const matchDoc of matchesSnapshot.docs) {
      const matchData = matchDoc.data();
      console.log(`Processing match ${matchDoc.id}:`, {
        confidence: matchData.confidence,
        distance: matchData.distance,
        hasLostRef: !!matchData.lostRef,
        lostRefPath: matchData.lostRef?.path
      });
      
      // Get the referenced lost item
      if (matchData.lostRef) {
        try {
          const lostItemDoc = await matchData.lostRef.get();
          if (lostItemDoc.exists) {
            const lostItemData = lostItemDoc.data();
            console.log(`Lost item ${lostItemDoc.id} found:`, {
              hasAttributes: !!lostItemData.attributes,
              category: lostItemData.attributes?.category,
              hasImages: !!lostItemData.images && lostItemData.images.length > 0
            });
            
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
          } else {
            console.log(`Lost item referenced by match ${matchDoc.id} does not exist`);
          }
        } catch (error) {
          console.error(`Error fetching lost item for match ${matchDoc.id}:`, error);
        }
      } else {
        console.log(`Match ${matchDoc.id} has no lostRef`);
      }
    }

    console.log(`Returning ${matches.length} matches`);
    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}