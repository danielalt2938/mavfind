// User and Auth Types
export type UserRole = "user" | "admin";

export interface User {
  email: string;
  role: UserRole;
}

// Location Types
export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  geo: GeoLocation;
  isActive: boolean;
}

export interface LocationDocument {
  locations: Location[];
}

// Item Attributes
export interface ItemAttributes {
  category: string;
  brand?: string;
  model?: string;
  color?: string;
  [key: string]: string | undefined;
}

// Request (Lost Item Report) Types
export type RequestStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "matched"
  | "claimed"
  | "rejected";

export interface Request {
  id?: string;
  ownerUid: string;
  locationId: string;
  status: RequestStatus;
  attributes: ItemAttributes;
  description: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

// Lost (Found Item) Types
export type LostItemStatus = "found" | "matched" | "claimed" | "archived";

export interface LostItem {
  id?: string;
  handlerUid: string;
  locationId: string;
  status: LostItemStatus;
  attributes: ItemAttributes;
  description: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

// API Request/Response Types
export interface CreateRequestInput {
  locationId: string;
  description: string;
  audioFile?: File;
  images?: File[];
}

export interface CreateLostItemInput {
  locationId: string;
  description: string;
  images?: File[];
}

export interface SearchInventoryParams {
  query?: string;
  category?: string;
  location?: string;
  page?: number;
  hitsPerPage?: number;
}

export interface UpdateRequestStatusInput {
  requestId: string;
  status: RequestStatus;
  matchedLostItemId?: string;
}

// NextAuth Session Extension
export interface ExtendedSession {
  user: {
    uid: string;
    email: string;
    role: UserRole;
    selectedLocationId?: string;
  };
}

// AI Response Types
export interface AIExtractedAttributes {
  category: string;
  brand?: string;
  model?: string;
  color?: string;
  additionalAttributes?: Record<string, string>;
}

export interface TranscriptionResult {
  text: string;
}
