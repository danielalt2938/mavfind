import { NextRequest, NextResponse } from "next/server";
import { extractAttributesFromMultipleSources } from "@/lib/ai/gemini";

// This endpoint will be called by ElevenLabs conversational AI
export async function POST(req: NextRequest) {
  try {
    const { transcript, conversation_id } = await req.json();

    console.log("Voice search request:", { transcript, conversation_id });

    if (!transcript) {
      return NextResponse.json(
        { error: "No transcript provided" },
        { status: 400 }
      );
    }

    // 1. Extract attributes from voice description (reuse existing AI!)
    const aiData = await extractAttributesFromMultipleSources(transcript);

    // 2. Import Firebase functions to search
    const { db } = await import("@/lib/firebase/admin");
    const { embedGenericDescription } = await import(
      "@/firebase-function-backend/src/ai"
    );

    const genericDesc =
      aiData.attributes?.genericDescription || transcript;

    // 3. Generate embedding
    const embedding = await embedGenericDescription(genericDesc);

    // 4. Search lost items using vector search (same as your matching system!)
    const query = db.collection("lost");

    const vectorQuery = query.findNearest("embedding", embedding as any, {
      limit: 3,
      distanceMeasure: "COSINE",
      distanceResultField: "vector_distance",
    });

    const results = await vectorQuery.get();

    if (results.empty) {
      return NextResponse.json({
        response:
          "I searched our database but couldn't find any matching items yet. Your description has been noted. Please check back later or visit the lost and found office at the University Center.",
      });
    }

    // 5. Get top match
    const topMatch = results.docs[0];
    const matchData = topMatch.data();
    const distance = matchData.vector_distance || 0;
    const confidence = Math.round((1 - distance / 2) * 100);

    // 6. Format location name
    const formatLocationName = (locationId?: string) => {
      if (!locationId) return "the main office";

      const locationMap: Record<string, string> = {
        university_center: "University Center",
        central_library: "Central Library",
        student_union: "Student Union",
      };

      return (
        locationMap[locationId] ||
        locationId
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      );
    };

    const location = formatLocationName(matchData.locationId);
    const description =
      matchData.attributes?.genericDescription ||
      matchData.description ||
      "an item";

    // 7. Build response for ElevenLabs to speak
    let response = `Great news! I found a match with ${confidence} percent confidence. `;
    response += `It's ${description}. `;
    response += `You can pick it up at ${location}. `;

    // Add additional matches if available
    if (results.docs.length > 1) {
      response += `I also found ${results.docs.length - 1} other possible matches. `;
    }

    response += `Would you like me to send these details to your phone via text message?`;

    return NextResponse.json({
      response,
      match: {
        id: topMatch.id,
        confidence,
        location: matchData.locationId,
        description: description,
      },
    });
  } catch (error) {
    console.error("Voice search error:", error);
    return NextResponse.json(
      {
        response:
          "I'm sorry, I encountered an error while searching. Please try again or visit the lost and found office directly.",
      },
      { status: 500 }
    );
  }
}
