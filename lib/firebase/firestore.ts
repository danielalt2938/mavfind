import { getFirestoreDb } from "./admin";
import {
  User,
  Request,
  LostItem,
  LocationDocument,
  NotificationPreferences,
} from "@/types";

const COLLECTIONS = {
  USERS: "users",
  REQUESTS: "requests",
  LOST: "lost",
  INFO: "info",
  EMAIL_QUEUE: "emailQueue",
} as const;

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
      notifyPrefs: {
        categories: [],
        locations: [],
        frequency: "instant",
      },
    });
}

export async function updateUserNotificationPrefs(
  uid: string,
  prefs: NotificationPreferences
): Promise<void> {
  const db = getFirestoreDb();
  await db.collection(COLLECTIONS.USERS).doc(uid).update({
    notifyPrefs: prefs,
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
  const docRef = await db.collection(COLLECTIONS.REQUESTS).add(request);
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
  const docRef = await db.collection(COLLECTIONS.LOST).add(lostItem);
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

// Email Queue Operations
export async function enqueueEmail(event: any): Promise<string> {
  const db = getFirestoreDb();
  const docRef = await db.collection(COLLECTIONS.EMAIL_QUEUE).add({
    event,
    createdAt: new Date().toISOString(),
    status: "pending",
  });
  return docRef.id;
}

export async function getPendingEmails(limit: number = 10): Promise<any[]> {
  const db = getFirestoreDb();
  const snapshot = await db
    .collection(COLLECTIONS.EMAIL_QUEUE)
    .where("status", "==", "pending")
    .orderBy("createdAt", "asc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function updateEmailStatus(
  emailId: string,
  status: "processing" | "sent" | "failed"
): Promise<void> {
  const db = getFirestoreDb();
  await db.collection(COLLECTIONS.EMAIL_QUEUE).doc(emailId).update({
    status,
    updatedAt: new Date().toISOString(),
  });
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
