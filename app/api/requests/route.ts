import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/server";
import { createRequest } from "@/lib/firebase/firestore";
import { uploadMultipleImages } from "@/lib/firebase/storage";
import { extractAttributesFromDescription } from "@/lib/ai/gemini";
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

    // Validate: at least one input (description, audio, or images)
    if (!finalDescription && imageFiles.length === 0) {
      return NextResponse.json(
        { error: "Please provide description, audio, or images" },
        { status: 400 }
      );
    }

    // Extract attributes using AI (only if description provided)
    const attributes: ItemAttributes = {
      category: "other", // default
    };

    if (finalDescription) {
      const aiAttributes = await extractAttributesFromDescription(finalDescription);
      attributes.category = aiAttributes.category;

      if (aiAttributes.brand) attributes.brand = aiAttributes.brand;
      if (aiAttributes.model) attributes.model = aiAttributes.model;
      if (aiAttributes.color) attributes.color = aiAttributes.color;

      // Add additional attributes
      Object.entries(aiAttributes.additionalAttributes || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          attributes[key] = value;
        }
      });
    }

    // Upload images
    const imageUrls =
      imageFiles.length > 0
        ? await uploadMultipleImages(imageFiles, "requests")
        : [];

    // Create request document
    const now = new Date().toISOString();
    const requestId = await createRequest({
      ownerUid: user.uid,
      locationId: "",  // Location not required for user requests
      status: "submitted",
      attributes,
      description: finalDescription || "",
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
