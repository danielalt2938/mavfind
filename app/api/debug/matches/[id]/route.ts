import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/firebase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const db = getFirestoreDb();

    console.log(`Debug: Checking matches for request: ${requestId}`);

    // Get the request document
    const requestDoc = await db.collection("requests").doc(requestId).get();
    const requestData = requestDoc.exists ? requestDoc.data() : null;

    // Get all matches in the subcollection
    const matchesSnapshot = await db
      .collection("requests")
      .doc(requestId)
      .collection("matches")
      .get();

    const matches = [];
    for (const matchDoc of matchesSnapshot.docs) {
      const matchData = matchDoc.data();
      
      let lostItemData = null;
      if (matchData.lostRef) {
        try {
          const lostItemDoc = await matchData.lostRef.get();
          lostItemData = lostItemDoc.exists ? {
            id: lostItemDoc.id,
            exists: true,
            data: lostItemDoc.data()
          } : {
            id: lostItemDoc.id,
            exists: false,
            data: null
          };
        } catch (error) {
          lostItemData = {
            error: error instanceof Error ? error.message : 'Unknown error',
            lostRefPath: matchData.lostRef.path
          };
        }
      }

      matches.push({
        matchId: matchDoc.id,
        matchData: {
          confidence: matchData.confidence,
          distance: matchData.distance,
          rank: matchData.rank,
          status: matchData.status,
          createdAt: matchData.createdAt?.toDate()?.toISOString(),
          updatedAt: matchData.updatedAt?.toDate()?.toISOString(),
          hasLostRef: !!matchData.lostRef,
          lostRefPath: matchData.lostRef?.path
        },
        lostItem: lostItemData
      });
    }

    return NextResponse.json({
      requestId,
      requestExists: requestDoc.exists,
      requestData: {
        userId: requestData?.userId,
        ownerUid: requestData?.ownerUid,
        title: requestData?.title,
        category: requestData?.category,
        status: requestData?.status
      },
      matchesCount: matchesSnapshot.size,
      matches
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { error: "Debug API error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}