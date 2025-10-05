import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIExtractedData, ItemCategory } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy-key");

const VALID_CATEGORIES: ItemCategory[] = [
  "electronics",
  "vehicle",
  "keys",
  "bag",
  "card",
  "clothing",
  "document",
  "jewelry",
  "accessory",
  "book",
  "stationery",
  "sports_equipment",
  "water_bottle",
  "headphones",
  "charger",
  "wallet",
  "glasses",
  "umbrella",
  "food_container",
  "calculator",
  "usb_drive",
  "textbook",
  "notebook",
  "art_supplies",
  "musical_instrument",
  "lab_equipment",
  "other",
];

export async function extractAttributesFromDescription(
  description: string
): Promise<AIExtractedData> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    You are an AI assistant that extracts structured information from lost and found item descriptions for a college campus.

Given the following description of a lost or found item, extract the following:

REQUIRED CORE FIELDS
- title: A short, descriptive title (e.g., "Lost iPhone 13 Pro", "Found Blue Backpack").
- category: Must be ONE of these exact values:
  electronics, vehicle, keys, bag, card, clothing, document, jewelry, accessory, book, stationery, sports_equipment, water_bottle, headphones, charger, wallet, glasses, umbrella, food_container, calculator, usb_drive, textbook, notebook, art_supplies, musical_instrument, lab_equipment, other
- subcategory: A more specific type (e.g., "laptop", "phone", "wallet", "backpack", "hydroflask", "airpods") or null.
- lostOrFound: One of "lost", "found", or null (infer from wording like "I lost..." vs "Found near...").

CONTEXT (for routing & matching)
- location: An object describing where it was lost/found if mentioned; otherwise all fields null.
  - building: Campus building name or common area (e.g., "Library", "Engineering Research Building") or null
  - roomOrArea: Room number/area ("Room 210", "north entrance", "parking lot F9") or null
  - landmark: Nearby landmark ("Starbucks in UC", "bus stop by lot 47") or null
  - areaType: One of "classroom","hallway","library","lab","cafeteria","gym","dorm","parking","outdoor","office","restroom","bus_stop","other" or null
  - campus: Campus name/acronym if stated (e.g., "UTA") or null
  - geo: { "lat": number or null, "lng": number or null } (only if explicit)
- times: Object capturing when information is given, else nulls.
  - lastSeenAt: ISO 8601 datetime if the user mentions when it was last seen; else null
  - foundAt: ISO 8601 datetime if the user mentions when it was found; else null
  - timeWindowText: Verbatim/approx phrasing if present (e.g., "yesterday around 3 pm", "Friday evening") or null

CONTACT & RECOVERY
- contact: Extract only if explicitly provided in the description; otherwise all fields null.
  - name: Full name or first name if given; else null
  - email: Email if given; else null
  - phone: Phone if given; else null
  - preferred: One of "email","phone","either" or null
  - rewardOfferedUSD: Number (not string) if a specific reward amount is stated; else null
- verificationQuestions: Up to 3 short questions derived from the description that a real owner should answer (e.g., "What color is the case?", "What are the last 4 digits?"). Use null if nothing useful.

ITEM ATTRIBUTES (extract all applicable)
- attributes:
  - genericDescription: An extremely detailed, comprehensive description including EVERY single detail mentioned — brand, model, color, size, material, condition, distinguishing features, stickers, engravings, decals, accessories, and any other information. Be as thorough and verbose as possible. If nothing beyond the title is present, use null.
  - brand: Brand name or null
  - model: Model name/number or null
  - color: Primary color(s) or null
  - size: Size info (S/M/L, dimensions, screen size, capacity) or null
  - material: Material type (leather, metal, plastic, fabric, etc.) or null
  - pattern: Pattern/design (striped, floral, solid, etc.) or null
  - condition: Physical condition (new, used, damaged, scratched, etc.) or null
  - distinguishingFeatures: Unique marks, stickers, charms, keychains, engravings, decals, cases, attachments or null
  - serialNumber: Serial number if mentioned or null
  - imeiNumber: IMEI number for phones if mentioned or null
  - licensePlate: License plate for vehicles if mentioned or null
  - lastFourDigits: Last 4 digits for cards/devices if mentioned or null
  - studentIdOnItem: Student name/ID appearing on the item if stated (do not infer) or null
  - additionalDetails: Any other relevant details not covered above or null

QUALITY & SEARCH OPTIMIZATION
- confidence:
  - overall: Number from 0 to 1 reflecting your confidence in the extraction given the description.
  - fields: An object with numeric confidences (0..1) for these keys if present: title, category, subcategory, lostOrFound, location, times, contact, attributes
- normalized:
  - colorsNormalized: Array of basic color words (e.g., ["black","blue"]) derived from color; empty array if none
  - keywords: Array of 5–15 searchable keywords/phrases from the description (brand, model, nicknames, building, room, landmarks). Empty array if none
- searchText: One long string concatenating the most matchable phrases (title + brand + model + subcategory + color + building/landmark + distinguishing features). If nothing, use null.

Description: "${description}"

STRICT OUTPUT INSTRUCTIONS
- Respond ONLY with valid JSON matching the exact structure below.
- Use null for any field not mentioned. Do NOT invent or infer sensitive data.
- All datetimes must be ISO 8601 strings (e.g., "2025-10-04T15:30:00Z") if present.
- Numbers must be numbers, not strings.
- Do NOT include any additional keys beyond those in the template.

Respond ONLY with valid JSON in this exact structure:
{
  "title": "short descriptive title",
  "category": "choose best category from the list above",
  "subcategory": "specific type or null",
  "lostOrFound": "lost" | "found" | null,
  "location": {
    "building": "string or null",
    "roomOrArea": "string or null",
    "landmark": "string or null",
    "areaType": "classroom" | "hallway" | "library" | "lab" | "cafeteria" | "gym" | "dorm" | "parking" | "outdoor" | "office" | "restroom" | "bus_stop" | "other" | null,
    "campus": "string or null",
    "geo": { "lat": number | null, "lng": number | null }
  },
  "times": {
    "lastSeenAt": "ISO 8601 datetime or null",
    "foundAt": "ISO 8601 datetime or null",
    "timeWindowText": "verbatim phrasing or null"
  },
  "contact": {
    "name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "preferred": "email" | "phone" | "either" | null,
    "rewardOfferedUSD": number | null
  },
  "verificationQuestions": ["string", "string", "string"] | null,
  "attributes": {
    "genericDescription": "EXTREMELY detailed comprehensive description including ALL mentioned details, be as verbose as possible or null",
    "brand": "brand name or null",
    "model": "model name or null",
    "color": "color or null",
    "size": "size or null",
    "material": "material or null",
    "pattern": "pattern or null",
    "condition": "condition or null",
    "distinguishingFeatures": "features or null",
    "serialNumber": "serial or null",
    "imeiNumber": "imei or null",
    "licensePlate": "plate or null",
    "lastFourDigits": "last4 or null",
    "studentIdOnItem": "name/id as written on item or null",
    "additionalDetails": "details or null"
  },
  "confidence": {
    "overall": 0.0,
    "fields": {
      "title": 0.0,
      "category": 0.0,
      "subcategory": 0.0,
      "lostOrFound": 0.0,
      "location": 0.0,
      "times": 0.0,
      "contact": 0.0,
      "attributes": 0.0
    }
  },
  "normalized": {
    "colorsNormalized": ["array of color words, empty if none"],
    "keywords": ["array of keywords/phrases, empty if none"]
  },
  "searchText": "concatenated matchable text or null"
}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from AI response");
    }

    const extracted = JSON.parse(jsonMatch[0]);

    // Validate category
    const category = VALID_CATEGORIES.includes(extracted.category)
      ? extracted.category
      : "other";

    return {
      title: extracted.title || "Item",
      category,
      subcategory: extracted.subcategory || undefined,
      attributes: {
        genericDescription:
          extracted.attributes?.genericDescription || undefined,
        brand: extracted.attributes?.brand || undefined,
        model: extracted.attributes?.model || undefined,
        color: extracted.attributes?.color || undefined,
        size: extracted.attributes?.size || undefined,
        material: extracted.attributes?.material || undefined,
        pattern: extracted.attributes?.pattern || undefined,
        condition: extracted.attributes?.condition || undefined,
        distinguishingFeatures:
          extracted.attributes?.distinguishingFeatures || undefined,
        serialNumber: extracted.attributes?.serialNumber || undefined,
        imeiNumber: extracted.attributes?.imeiNumber || undefined,
        licensePlate: extracted.attributes?.licensePlate || undefined,
        additionalDetails: extracted.attributes?.additionalDetails || undefined,
      },
    };
  } catch (error) {
    console.error("Error extracting attributes with Gemini:", error);
    // Return default values on error
    return {
      title: "Item",
      category: "other",
      attributes: {},
    };
  }
}

export async function extractAttributesFromImage(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<Partial<AIExtractedData>> {
  try {
    console.log("Starting image analysis with Gemini Vision...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
Analyze this image of a lost or found item on a college campus and extract structured information:
- title: A short, descriptive title for the item
- category: Choose from: electronics, vehicle, keys, bag, card, clothing, document, jewelry, accessory, book, stationery, sports_equipment, water_bottle, headphones, charger, wallet, glasses, umbrella, food_container, calculator, usb_drive, textbook, notebook, art_supplies, musical_instrument, lab_equipment, other
- subcategory: A more specific type (e.g., "laptop", "phone", "wallet", "backpack", "hydroflask", "airpods")
- attributes (extract all visible):
  - genericDescription: An extremely detailed, comprehensive visual description including EVERY single visible detail - brand, model, color, size, material, condition, patterns, logos, stickers, scratches, wear marks, accessories, and any other visible information. Be as thorough and verbose as possible, describing everything you can see.
  - brand: Brand name if visible
  - model: Model name/number if visible
  - color: Primary color(s)
  - size: Size if discernible (S/M/L, dimensions)
  - material: Material type (leather, metal, plastic, fabric, etc.)
  - pattern: Pattern/design (striped, floral, solid, etc.)
  - condition: Physical condition (new, used, damaged, scratched)
  - distinguishingFeatures: Unique marks, scratches, stickers, logos, accessories
  - serialNumber: Serial number if visible
  - imeiNumber: IMEI number if visible
  - licensePlate: License plate for vehicles if visible
  - additionalDetails: Any other visible details

Respond ONLY with valid JSON in this exact structure:
{
  "title": "short descriptive title",
  "category": "choose best category from list above",
  "subcategory": "specific type or null",
  "attributes": {
    "genericDescription": "EXTREMELY detailed comprehensive visual description including ALL visible details, be as verbose and thorough as possible describing everything visible or null",
    "brand": "brand name or null",
    "model": "model name or null",
    "color": "color or null",
    "size": "size or null",
    "material": "material or null",
    "pattern": "pattern or null",
    "condition": "condition or null",
    "distinguishingFeatures": "features or null",
    "serialNumber": "serial or null",
    "imeiNumber": "imei or null",
    "licensePlate": "plate or null",
    "additionalDetails": "details or null"
  }
}

Be thorough and extract ALL visible details. Use null for fields not visible.
`;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    };

    console.log(
      `Sending image to Gemini (${mimeType}, ${imageBase64.length} chars base64)`
    );
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    console.log("Gemini Vision response:", text);

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from AI response");
    }

    const extracted = JSON.parse(jsonMatch[0]);

    // Validate category
    const category = VALID_CATEGORIES.includes(extracted.category)
      ? extracted.category
      : undefined;

    const result_data = {
      title: extracted.title || undefined,
      category,
      subcategory: extracted.subcategory || undefined,
      attributes: {
        genericDescription:
          extracted.attributes?.genericDescription || undefined,
        brand: extracted.attributes?.brand || undefined,
        model: extracted.attributes?.model || undefined,
        color: extracted.attributes?.color || undefined,
        size: extracted.attributes?.size || undefined,
        material: extracted.attributes?.material || undefined,
        pattern: extracted.attributes?.pattern || undefined,
        condition: extracted.attributes?.condition || undefined,
        distinguishingFeatures:
          extracted.attributes?.distinguishingFeatures || undefined,
        serialNumber: extracted.attributes?.serialNumber || undefined,
        imeiNumber: extracted.attributes?.imeiNumber || undefined,
        licensePlate: extracted.attributes?.licensePlate || undefined,
        additionalDetails: extracted.attributes?.additionalDetails || undefined,
      },
    };

    console.log("Parsed image data:", result_data);
    return result_data;
  } catch (error) {
    console.error("Error extracting attributes from image:", error);
    return {};
  }
}

// Helper function to combine description and image analysis
export async function extractAttributesFromMultipleSources(
  description?: string,
  imageFiles?: File[]
): Promise<AIExtractedData> {
  let descriptionData: AIExtractedData = {
    title: "Item",
    category: "other",
    attributes: {},
  };

  let imageData: Partial<AIExtractedData> = {};

  // Extract from description if provided
  if (description) {
    descriptionData = await extractAttributesFromDescription(description);
  }

  // Extract from first image if provided
  if (imageFiles && imageFiles.length > 0) {
    try {
      console.log(
        `Processing image for AI analysis: ${imageFiles[0].name}, type: ${imageFiles[0].type}`
      );
      const file = imageFiles[0];
      const base64 = await fileToBase64(file);
      imageData = await extractAttributesFromImage(base64, file.type);
      console.log("Image analysis result:", imageData);
    } catch (error) {
      console.error("Error processing image:", error);
    }
  }

  // Merge data, prioritizing description but filling in gaps from image
  const result = {
    title: descriptionData.title || imageData.title || "Item",
    category: descriptionData.category || imageData.category || "other",
    subcategory: descriptionData.subcategory || imageData.subcategory,
    attributes: {
      genericDescription:
        descriptionData.attributes.genericDescription ||
        imageData.attributes?.genericDescription,
      brand: descriptionData.attributes.brand || imageData.attributes?.brand,
      model: descriptionData.attributes.model || imageData.attributes?.model,
      color: descriptionData.attributes.color || imageData.attributes?.color,
      size: descriptionData.attributes.size || imageData.attributes?.size,
      material:
        descriptionData.attributes.material || imageData.attributes?.material,
      pattern:
        descriptionData.attributes.pattern || imageData.attributes?.pattern,
      condition:
        descriptionData.attributes.condition || imageData.attributes?.condition,
      distinguishingFeatures:
        descriptionData.attributes.distinguishingFeatures ||
        imageData.attributes?.distinguishingFeatures,
      serialNumber:
        descriptionData.attributes.serialNumber ||
        imageData.attributes?.serialNumber,
      imeiNumber:
        descriptionData.attributes.imeiNumber ||
        imageData.attributes?.imeiNumber,
      licensePlate:
        descriptionData.attributes.licensePlate ||
        imageData.attributes?.licensePlate,
      additionalDetails:
        descriptionData.attributes.additionalDetails ||
        imageData.attributes?.additionalDetails,
    },
  };

  console.log("Final merged data:", result);
  return result;
}

// Helper to convert File to base64 (server-side)
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString("base64");
}
