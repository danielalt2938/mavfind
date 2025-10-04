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
  "other",
];

export async function extractAttributesFromDescription(
  description: string
): Promise<AIExtractedData> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an AI assistant that extracts structured information from lost and found item descriptions.

Given the following description of a lost or found item, extract the following:
- title: A short, descriptive title (e.g., "Lost iPhone 13 Pro", "Found Blue Backpack")
- category: Must be ONE of these exact values: electronics, vehicle, keys, bag, card, clothing, document, other
- subcategory: A more specific type (e.g., "laptop", "phone", "wallet", "backpack")
- attributes:
  - brand: Brand name if mentioned
  - model: Model name/number if mentioned
  - color: Color if mentioned
  - any other relevant attributes

Description: "${description}"

Respond ONLY with valid JSON in this exact structure:
{
  "title": "short descriptive title",
  "category": "one of: electronics|vehicle|keys|bag|card|clothing|document|other",
  "subcategory": "specific type or null",
  "attributes": {
    "brand": "brand name or null",
    "model": "model name or null",
    "color": "color or null"
  }
}

Be concise and only include information that is explicitly stated or can be reasonably inferred.
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
        brand: extracted.attributes?.brand || undefined,
        model: extracted.attributes?.model || undefined,
        color: extracted.attributes?.color || undefined,
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
Analyze this image of a lost or found item and extract structured information:
- title: A short, descriptive title for the item
- category: Must be ONE of these exact values: electronics, vehicle, keys, bag, card, clothing, document, other
- subcategory: A more specific type (e.g., "laptop", "phone", "wallet", "backpack")
- attributes:
  - brand: Brand name if visible
  - model: Model name/number if visible
  - color: Primary color(s)
  - any other distinctive features you can identify

Respond ONLY with valid JSON in this exact structure:
{
  "title": "short descriptive title",
  "category": "one of: electronics|vehicle|keys|bag|card|clothing|document|other",
  "subcategory": "specific type or null",
  "attributes": {
    "brand": "brand name or null",
    "model": "model name or null",
    "color": "color or null"
  }
}

Be specific and only include information that is clearly visible in the image.
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
        brand: extracted.attributes?.brand || undefined,
        model: extracted.attributes?.model || undefined,
        color: extracted.attributes?.color || undefined,
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
      brand: descriptionData.attributes.brand || imageData.attributes?.brand,
      model: descriptionData.attributes.model || imageData.attributes?.model,
      color: descriptionData.attributes.color || imageData.attributes?.color,
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
