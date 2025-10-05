import { getFirestoreDb } from "./admin";
import {
  User,
  Request,
  LostItem,
  LocationDocument,
} from "@/types";

const COLLECTIONS = {
  USERS: "users",
  REQUESTS: "requests",
  LOST: "lost",
  INFO: "info",
} as const;

// Helper function to remove undefined values from an object
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const cleaned = removeUndefined(value);
      if (Object.keys(cleaned).length > 0) {
        result[key] = cleaned;
      }
    } else if (Array.isArray(value)) {
      const cleanedArray = value.filter(item => item !== undefined);
      if (cleanedArray.length > 0) {
        result[key] = cleanedArray;
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

// User Operations
export async function getUser(uid: string): Promise<User | null> {
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
  if (!doc.exists) return null;
  return doc.data() as User;
}

export async function createUser(
  uid: string,
  email: string,
  role: "user" | "admin" = "user"
): Promise<void> {
  const db = getFirestoreDb();
  await db
    .collection(COLLECTIONS.USERS)
    .doc(uid)
    .set({
      email,
      role,
    });
}

// Location Operations
export async function getLocations(): Promise<LocationDocument | null> {
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTIONS.INFO).doc("location").get();
  if (!doc.exists) return null;
  return doc.data() as LocationDocument;
}

// Request Operations
export async function createRequest(
  request: Omit<Request, "id">
): Promise<string> {
  const db = getFirestoreDb();
  const cleanedRequest = removeUndefined(request as any);
  const docRef = await db.collection(COLLECTIONS.REQUESTS).add(cleanedRequest);
  return docRef.id;
}

export async function getRequest(requestId: string): Promise<Request | null> {
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTIONS.REQUESTS).doc(requestId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Request;
}

export async function getUserRequests(ownerUid: string): Promise<Request[]> {
  const db = getFirestoreDb();
  const snapshot = await db
    .collection(COLLECTIONS.REQUESTS)
    .where("ownerUid", "==", ownerUid)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Request[];
}

export async function updateRequestStatus(
  requestId: string,
  status: Request["status"],
  matchedLostItemId?: string
): Promise<void> {
  const db = getFirestoreDb();
  const updateData: any = {
    status,
    updatedAt: new Date().toISOString(),
  };

  if (matchedLostItemId) {
    updateData.matchedLostItemId = matchedLostItemId;
  }

  await db.collection(COLLECTIONS.REQUESTS).doc(requestId).update(updateData);
}

// Lost Item Operations
export async function createLostItem(
  lostItem: Omit<LostItem, "id">
): Promise<string> {
  const db = getFirestoreDb();
  const cleanedLostItem = removeUndefined(lostItem as any);
  const docRef = await db.collection(COLLECTIONS.LOST).add(cleanedLostItem);
  return docRef.id;
}

export async function getLostItem(lostId: string): Promise<LostItem | null> {
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTIONS.LOST).doc(lostId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as LostItem;
}

export async function updateLostItemStatus(
  lostId: string,
  status: LostItem["status"]
): Promise<void> {
  const db = getFirestoreDb();
  await db.collection(COLLECTIONS.LOST).doc(lostId).update({
    status,
    updatedAt: new Date().toISOString(),
  });
}

export async function getLocationLostItems(
  locationId: string
): Promise<LostItem[]> {
  const db = getFirestoreDb();
  const snapshot = await db
    .collection(COLLECTIONS.LOST)
    .where("locationId", "==", locationId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as LostItem[];
}

// Search - Get all items for indexing
export async function getAllItemsForIndexing(): Promise<
  Array<Request | LostItem>
> {
  const db = getFirestoreDb();

  const [requestsSnapshot, lostSnapshot] = await Promise.all([
    db.collection(COLLECTIONS.REQUESTS).get(),
    db.collection(COLLECTIONS.LOST).get(),
  ]);

  const requests = requestsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Request));

  const lostItems = lostSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as LostItem));

  return [...requests, ...lostItems];
}
