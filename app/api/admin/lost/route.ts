import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/server";
import { createLostItem, getLocations } from "@/lib/firebase/firestore";
import { uploadMultipleImages } from "@/lib/firebase/storage";
import { extractAttributesFromMultipleSources } from "@/lib/ai/gemini";
import { GeoLocation } from "@/types";

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

    // Extract data using AI from both description and images
    const aiData = await extractAttributesFromMultipleSources(
      description,
      imageFiles.length > 0 ? imageFiles : undefined
    );

    if (!aiData.category) {
      return NextResponse.json(
        { error: "Failed to extract category from description or images" },
        { status: 400 }
      );
    }

    // Get geo coordinates from location
    let geo: GeoLocation | undefined;
    const locationsDoc = await getLocations();
    if (locationsDoc) {
      const location = locationsDoc.locations.find((loc) => loc.id === locationId);
      if (location) {
        geo = location.geo;
      }
    }

    // Upload images
    const imageUrls =
      imageFiles.length > 0
        ? await uploadMultipleImages(imageFiles, "lost")
        : [];

    // Create lost item document with AI-extracted data
    const now = new Date().toISOString();
    const lostItemId = await createLostItem({
      title: aiData.title,
      description,
      category: aiData.category,
      subcategory: aiData.subcategory,
      attributes: aiData.attributes,
      images: imageUrls,
      locationId,
      geo,
      handlerUid: user.uid,
      status: "found",
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
