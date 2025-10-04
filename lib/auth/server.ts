import { getFirestoreDb } from "@/lib/firebase/admin";
import { initializeFirebaseAdmin } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { NextRequest } from "next/server";
import { UserRole } from "@/types";

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role: UserRole;
}

export async function verifyAuthToken(
  req: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split("Bearer ")[1];

    // Initialize Firebase Admin if needed
    initializeFirebaseAdmin();
    const auth = getAuth();

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);

    if (!decodedToken.uid) {
      return null;
    }

    // Get user from Firestore
    const db = getFirestoreDb();
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      // Create user if doesn't exist
      await db.collection("users").doc(decodedToken.uid).set({
        email: decodedToken.email || "",
        role: "user",
        notifyPrefs: {
          categories: [],
          locations: [],
          frequency: "instant",
        },
      });

      return {
        uid: decodedToken.uid,
        email: decodedToken.email || "",
        role: "user",
      };
    }

    const userData = userDoc.data();

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      role: userData?.role || "user",
    };
  } catch (error) {
    console.error("Error verifying auth token:", error);
    return null;
  }
}
