import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { createLostItem, getUser } from "@/lib/firebase/firestore";
import { uploadMultipleImages } from "@/lib/firebase/storage";
import { extractAttributesFromDescription } from "@/lib/ai/gemini";
import { indexItem } from "@/lib/search/algolia";
import { enqueueEmail } from "@/lib/firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "admin") {
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
        ? await uploadMultipleImages(imageFiles, "lost")
        : [];

    // Create lost item document
    const now = new Date().toISOString();
    const lostItemId = await createLostItem({
      handlerUid: (session.user as any).uid,
      locationId,
      status: "found",
      attributes,
      description,
      images: imageUrls,
      createdAt: now,
      updatedAt: now,
    });

    // Index in Algolia
    await indexItem(
      {
        id: lostItemId,
        handlerUid: (session.user as any).uid,
        locationId,
        status: "found",
        attributes,
        description,
        images: imageUrls,
        createdAt: now,
        updatedAt: now,
      },
      "lost"
    );

    // Queue notification emails for subscribed users
    const db = getFirestoreDb();
    const usersSnapshot = await db.collection("users").get();

    const notificationPromises = usersSnapshot.docs
      .filter((doc) => {
        const data = doc.data();
        const prefs = data.notifyPrefs;
        if (!prefs) return false;

        // Check if user is subscribed to this category and location
        const categoryMatch =
          prefs.categories.length === 0 ||
          prefs.categories.includes(attributes.category);
        const locationMatch =
          prefs.locations.length === 0 ||
          prefs.locations.includes(locationId);

        return categoryMatch && locationMatch;
      })
      .map((doc) => {
        const data = doc.data();
        return enqueueEmail({
          type: "new_lost_item",
          recipientEmail: data.email,
          data: {
            itemType: "lost",
            itemId: lostItemId,
            description,
            locationName: locationId,
          },
        });
      });

    await Promise.all(notificationPromises);

    return NextResponse.json({ success: true, lostItemId }, { status: 201 });
  } catch (error) {
    console.error("Error creating lost item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
