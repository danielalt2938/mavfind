import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/server";
import { createLostItem } from "@/lib/firebase/firestore";
import { uploadMultipleImages } from "@/lib/firebase/storage";
import { extractAttributesFromDescription } from "@/lib/ai/gemini";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const locationId = formData.get("locationId") as string;
    const description = formData.get("description") as string;
    const imageFiles = formData.getAll("images") as File[];

    if (!locationId || !description) {
      return NextResponse.json(
        { error: "Location ID and description are required" },
        { status: 400 }
      );
    }

    // Extract attributes using AI
    const aiAttributes = await extractAttributesFromDescription(description);

    // Convert AI attributes to ItemAttributes format - remove undefined values
    const attributes: Record<string, string> = {
      category: aiAttributes.category,
    };

    if (aiAttributes.brand) attributes.brand = aiAttributes.brand;
    if (aiAttributes.model) attributes.model = aiAttributes.model;
    if (aiAttributes.color) attributes.color = aiAttributes.color;

    // Add additional attributes
    Object.entries(aiAttributes.additionalAttributes || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        attributes[key] = value;
      }
    });

    // Upload images
    const imageUrls =
      imageFiles.length > 0
        ? await uploadMultipleImages(imageFiles, "lost")
        : [];

    // Create lost item document
    const now = new Date().toISOString();
    const lostItemId = await createLostItem({
      handlerUid: user.uid,
      locationId,
      status: "found",
      attributes,
      description,
      images: imageUrls,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, lostItemId }, { status: 201 });
  } catch (error) {
    console.error("Error creating lost item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
