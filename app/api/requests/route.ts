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

    // Validate: at least description or images must be provided
    if (!finalDescription && imageFiles.length === 0) {
      return NextResponse.json(
        { error: "Please provide a description or upload images" },
        { status: 400 }
      );
    }

    // Extract data using AI from both description and images
    let aiData;
    try {
      console.log("Starting AI analysis...", {
        hasDescription: !!finalDescription,
        imageCount: imageFiles.length,
        descriptionLength: finalDescription?.length || 0,
      });

      aiData = await extractAttributesFromMultipleSources(
        finalDescription || undefined,
        imageFiles.length > 0 ? imageFiles : undefined
      );

      console.log("AI analysis completed:", aiData);
    } catch (error) {
      console.error("AI analysis failed:", error);

      // If it's an API configuration error, return a specific error
      if (
        error instanceof Error &&
        error.message.includes("AI service configuration")
      ) {
        return NextResponse.json(
          {
            error:
              "AI service is currently unavailable. Please try again later.",
          },
          { status: 503 }
        );
      }

      // For other AI errors, use fallback data
      aiData = {
        title: "Item",
        category: "other",
        attributes: {
          genericDescription: finalDescription || undefined,
        },
      };

      console.log("Using fallback AI data:", aiData);
    }

    // Upload images
    let imageUrls: string[] = [];
    if (imageFiles.length > 0) {
      try {
        console.log(`Uploading ${imageFiles.length} images...`);
        imageUrls = await uploadMultipleImages(imageFiles, "requests");
        console.log("Images uploaded successfully:", imageUrls);
      } catch (error) {
        console.error("Image upload failed:", error);
        return NextResponse.json(
          { error: "Failed to upload images. Please try again." },
          { status: 500 }
        );
      }
    }

    // Create request document with AI-extracted data
    const now = new Date().toISOString();
    const requestData: any = {
      title: aiData.title,
      description: finalDescription || "",
      category: aiData.category,
      images: imageUrls,
      locationId: "", // Location not required for user requests
      ownerUid: user.uid,
      status: "submitted",
      createdAt: now,
      updatedAt: now,
    };

    // Only add optional fields if they have values
    if (aiData.subcategory) {
      requestData.subcategory = aiData.subcategory;
    }

    // Filter out undefined values from attributes
    const filteredAttributes: Record<string, string> = {};
    filteredAttributes.genericDescription = finalDescription;

    // if ai already has a generic description, use that instead of the final description
    if (aiData.attributes) {
      Object.entries(aiData.attributes).forEach(([key, value]) => {
        if (value !== undefined) {
          filteredAttributes[key] = value;
        }
      });
    }
    requestData.attributes = filteredAttributes;
    requestData.genericDescription =
      filteredAttributes.genericDescription || finalDescription;

    let requestId;
    try {
      console.log("Creating request document...", {
        title: requestData.title,
        category: requestData.category,
        hasImages: imageUrls.length > 0,
        hasDescription: !!requestData.description,
      });

      requestId = await createRequest(requestData);
      console.log("Request created successfully:", requestId);
    } catch (error) {
      console.error("Failed to create request:", error);
      return NextResponse.json(
        { error: "Failed to save request. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, requestId }, { status: 201 });
  } catch (error) {
    console.error("Error creating request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
