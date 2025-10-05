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

// Item Categories
export type ItemCategory =
  | "electronics"
  | "vehicle"
  | "keys"
  | "bag"
  | "card"
  | "clothing"
  | "document"
  | "jewelry"
  | "accessory"
  | "book"
  | "stationery"
  | "sports_equipment"
  | "water_bottle"
  | "headphones"
  | "charger"
  | "wallet"
  | "glasses"
  | "umbrella"
  | "food_container"
  | "calculator"
  | "usb_drive"
  | "textbook"
  | "notebook"
  | "art_supplies"
  | "musical_instrument"
  | "lab_equipment"
  | "other";

// Item Attributes
export interface ItemAttributes {
  genericDescription?: string; // Full description extracted by AI
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  material?: string;
  pattern?: string;
  condition?: string;
  distinguishingFeatures?: string;
  serialNumber?: string;
  imeiNumber?: string;
  licensePlate?: string;
  additionalDetails?: string;
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
  title: string;
  description: string;
  category: ItemCategory;
  subcategory?: string;
  attributes: ItemAttributes;
  images: string[];
  locationId: string;
  geo?: GeoLocation;
  ownerUid: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

// Lost (Found Item) Types
export type LostItemStatus = "found" | "matched" | "claimed" | "archived";

export interface LostItem {
  id?: string;
  title: string;
  description: string;
  category: ItemCategory;
  subcategory?: string;
  attributes: ItemAttributes;
  images: string[];
  locationId: string;
  geo?: GeoLocation;
  handlerUid: string;
  status: LostItemStatus;
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
export interface AIExtractedData {
  title: string;
  category: ItemCategory;
  subcategory?: string;
  genericDescription?: string;
  attributes: {
    brand?: string;
    model?: string;
    color?: string;
    [key: string]: string | undefined;
  };
}

export interface TranscriptionResult {
  text: string;
}
