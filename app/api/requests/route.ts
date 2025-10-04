import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/server";
import { createRequest } from "@/lib/firebase/firestore";
import { uploadMultipleImages } from "@/lib/firebase/storage";
import { extractAttributesFromDescription } from "@/lib/ai/gemini";
import { transcribeAudio } from "@/lib/ai/whisper";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const locationId = formData.get("locationId") as string;
    const description = formData.get("description") as string;
    const audioFile = formData.get("audioFile") as File | null;
    const imageFiles = formData.getAll("images") as File[];

    if (!locationId) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 }
      );
    }

    // Transcribe audio if provided
    let finalDescription = description;
    if (audioFile) {
      const transcription = await transcribeAudio(audioFile);
      finalDescription = transcription.text;
    }

    if (!finalDescription) {
      return NextResponse.json(
        { error: "Description or audio is required" },
        { status: 400 }
      );
    }

    // Extract attributes using AI
    const aiAttributes = await extractAttributesFromDescription(finalDescription);

    // Convert AI attributes to ItemAttributes format
    const attributes = {
      category: aiAttributes.category,
      brand: aiAttributes.brand,
      model: aiAttributes.model,
      color: aiAttributes.color,
      ...aiAttributes.additionalAttributes,
    };

    // Upload images
    const imageUrls =
      imageFiles.length > 0
        ? await uploadMultipleImages(imageFiles, "requests")
        : [];

    // Create request document
    const now = new Date().toISOString();
    const requestId = await createRequest({
      ownerUid: user.uid,
      locationId,
      status: "submitted",
      attributes,
      description: finalDescription,
      images: imageUrls,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, requestId }, { status: 201 });
  } catch (error) {
    console.error("Error creating request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
