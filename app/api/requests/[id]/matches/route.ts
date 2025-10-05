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
    console.log(`[DEBUG] Processing request for matches: ${requestId}`);
    console.log(`[DEBUG] Current user ID: ${userId}`);

    // Verify the request belongs to the user
    const requestDoc = await db.collection("requests").doc(requestId).get();
    if (!requestDoc.exists) {
      console.log(`[DEBUG] Request not found: ${requestId}`);
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const requestData = requestDoc.data();
    console.log(`[DEBUG] Request data for ${requestId}:`, {
      userId: requestData?.userId,
      ownerUid: requestData?.ownerUid,
      currentUserId: userId,
      title: requestData?.title,
      status: requestData?.status
    });
    
    // Check both possible field names for user ID
    const requestUserId = requestData?.userId || requestData?.ownerUid;
    if (requestUserId !== userId) {
      console.log(`[DEBUG] Authorization failed: request user ${requestUserId} !== current user ${userId}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch matches for this request
    console.log(`[DEBUG] Authorization passed. Fetching matches for request: ${requestId}`);
    const matchesSnapshot = await db
      .collection("requests")
      .doc(requestId)
      .collection("matches")
      .orderBy("confidence", "desc")
      .get();

    console.log(`[DEBUG] Found ${matchesSnapshot.size} match documents in subcollection`);
    
    // Log each match document for debugging
    if (matchesSnapshot.size > 0) {
      matchesSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`[DEBUG] Match ${index + 1} (${doc.id}):`, {
          confidence: data.confidence,
          distance: data.distance,
          rank: data.rank,
          status: data.status,
          hasLostRef: !!data.lostRef,
          lostRefPath: data.lostRef?.path
        });
      });
    } else {
      console.log(`[DEBUG] No matches found in subcollection for request ${requestId}`);
    }

    const matches = [];
    for (const matchDoc of matchesSnapshot.docs) {
      const matchData = matchDoc.data();
      console.log(`[DEBUG] Processing match ${matchDoc.id}:`, {
        confidence: matchData.confidence,
        distance: matchData.distance,
        hasLostRef: !!matchData.lostRef,
        lostRefPath: matchData.lostRef?.path
      });
      
      // Get the referenced lost item
      if (matchData.lostRef) {
        try {
          console.log(`[DEBUG] Fetching lost item for match ${matchDoc.id} at path: ${matchData.lostRef.path}`);
          const lostItemDoc = await matchData.lostRef.get();
          if (lostItemDoc.exists) {
            const lostItemData = lostItemDoc.data();
            console.log(`[DEBUG] Lost item ${lostItemDoc.id} found:`, {
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
            console.log(`[DEBUG] Successfully processed match ${matchDoc.id}, total matches so far: ${matches.length}`);
          } else {
            console.log(`[DEBUG] Lost item referenced by match ${matchDoc.id} does not exist at path: ${matchData.lostRef.path}`);
          }
        } catch (error) {
          console.error(`[DEBUG] Error fetching lost item for match ${matchDoc.id}:`, error);
        }
      } else {
        console.log(`[DEBUG] Match ${matchDoc.id} has no lostRef - SKIPPING`);
      }
    }

    console.log(`[DEBUG] Final result: Returning ${matches.length} matches out of ${matchesSnapshot.size} match documents`);
    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}