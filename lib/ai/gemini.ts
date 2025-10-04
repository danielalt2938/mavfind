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
- title: A short, descriptive title (e.g., "Lost iPhone 13 Pro", "Found Blue Backpack")
- category: Must be ONE of these exact values: electronics, vehicle, keys, bag, card, clothing, document, jewelry, accessory, book, stationery, sports_equipment, water_bottle, headphones, charger, wallet, glasses, umbrella, food_container, calculator, usb_drive, textbook, notebook, art_supplies, musical_instrument, lab_equipment, other
- subcategory: A more specific type (e.g., "laptop", "phone", "wallet", "backpack", "hydroflask", "airpods")
- attributes (extract all applicable):
  - genericDescription: An extremely detailed, comprehensive description including EVERY single detail mentioned - brand, model, color, size, material, condition, distinguishing features, and any other information. Be as thorough and verbose as possible.
  - brand: Brand name if mentioned
  - model: Model name/number if mentioned
  - color: Primary color(s) if mentioned
  - size: Size information (S/M/L, dimensions, screen size, etc.)
  - material: Material type (leather, metal, plastic, fabric, etc.)
  - pattern: Pattern/design (striped, floral, solid, etc.)
  - condition: Physical condition (new, used, damaged, scratched, etc.)
  - distinguishingFeatures: Any unique marks, scratches, stickers, accessories
  - serialNumber: Serial number if mentioned
  - imeiNumber: IMEI number for phones if mentioned
  - licensePlate: License plate for vehicles if mentioned
  - additionalDetails: Any other relevant details not covered above

Description: "${description}"

Respond ONLY with valid JSON in this exact structure:
{
  "title": "short descriptive title",
  "category": "choose best category from the list above",
  "subcategory": "specific type or null",
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
    "additionalDetails": "details or null"
  }
}

Be thorough and extract ALL mentioned details. Use null for fields not mentioned.
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
        genericDescription: extracted.attributes?.genericDescription || undefined,
        brand: extracted.attributes?.brand || undefined,
        model: extracted.attributes?.model || undefined,
        color: extracted.attributes?.color || undefined,
        size: extracted.attributes?.size || undefined,
        material: extracted.attributes?.material || undefined,
        pattern: extracted.attributes?.pattern || undefined,
        condition: extracted.attributes?.condition || undefined,
        distinguishingFeatures: extracted.attributes?.distinguishingFeatures || undefined,
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
        genericDescription: extracted.attributes?.genericDescription || undefined,
        brand: extracted.attributes?.brand || undefined,
        model: extracted.attributes?.model || undefined,
        color: extracted.attributes?.color || undefined,
        size: extracted.attributes?.size || undefined,
        material: extracted.attributes?.material || undefined,
        pattern: extracted.attributes?.pattern || undefined,
        condition: extracted.attributes?.condition || undefined,
        distinguishingFeatures: extracted.attributes?.distinguishingFeatures || undefined,
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
      genericDescription: descriptionData.attributes.genericDescription || imageData.attributes?.genericDescription,
      brand: descriptionData.attributes.brand || imageData.attributes?.brand,
      model: descriptionData.attributes.model || imageData.attributes?.model,
      color: descriptionData.attributes.color || imageData.attributes?.color,
      size: descriptionData.attributes.size || imageData.attributes?.size,
      material: descriptionData.attributes.material || imageData.attributes?.material,
      pattern: descriptionData.attributes.pattern || imageData.attributes?.pattern,
      condition: descriptionData.attributes.condition || imageData.attributes?.condition,
      distinguishingFeatures: descriptionData.attributes.distinguishingFeatures || imageData.attributes?.distinguishingFeatures,
      serialNumber: descriptionData.attributes.serialNumber || imageData.attributes?.serialNumber,
      imeiNumber: descriptionData.attributes.imeiNumber || imageData.attributes?.imeiNumber,
      licensePlate: descriptionData.attributes.licensePlate || imageData.attributes?.licensePlate,
      additionalDetails: descriptionData.attributes.additionalDetails || imageData.attributes?.additionalDetails,
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
