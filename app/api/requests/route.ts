import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/server";
import { createRequest } from "@/lib/firebase/firestore";
import { uploadMultipleImages } from "@/lib/firebase/storage";
import { extractAttributesFromMultipleSources } from "@/lib/ai/gemini";
import { transcribeAudio } from "@/lib/ai/whisper";
import { ItemAttributes } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const description = formData.get("description") as string;
    const audioFile = formData.get("audioFile") as File | null;
    const imageFiles = formData.getAll("images") as File[];

    // Transcribe audio if provided
    let finalDescription = description;
    if (audioFile) {
      const transcription = await transcribeAudio(audioFile);
      finalDescription = transcription.text;
    }

    // Validate: minimum 100 characters for description OR images must be provided
    if (finalDescription && finalDescription.length < 100) {
      return NextResponse.json(
        { error: "Description must be at least 100 characters" },
        { status: 400 }
      );
    }

    if (!finalDescription && imageFiles.length === 0) {
      return NextResponse.json(
        { error: "Please provide either a description (min 100 chars) or upload images" },
        { status: 400 }
      );
    }

    // Extract data using AI from both description and images
    const aiData = await extractAttributesFromMultipleSources(
      finalDescription || undefined,
      imageFiles.length > 0 ? imageFiles : undefined
    );

    // Upload images
    const imageUrls =
      imageFiles.length > 0
        ? await uploadMultipleImages(imageFiles, "requests")
        : [];

    // Create request document with AI-extracted data
    const now = new Date().toISOString();
    const requestId = await createRequest({
      title: aiData.title,
      description: finalDescription || "",
      category: aiData.category,
      subcategory: aiData.subcategory,
      attributes: aiData.attributes,
      images: imageUrls,
      locationId: "",  // Location not required for user requests
      ownerUid: user.uid,
      status: "submitted",
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
