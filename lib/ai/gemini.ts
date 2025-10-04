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
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    const result = await model.generateContent([prompt, imagePart]);
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
      : undefined;

    return {
      title: extracted.title || undefined,
      category,
      subcategory: extracted.subcategory || undefined,
      attributes: {
        brand: extracted.attributes?.brand || undefined,
        model: extracted.attributes?.model || undefined,
        color: extracted.attributes?.color || undefined,
      },
    };
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
      const file = imageFiles[0];
      const base64 = await fileToBase64(file);
      imageData = await extractAttributesFromImage(base64, file.type);
    } catch (error) {
      console.error("Error processing image:", error);
    }
  }

  // Merge data, prioritizing description but filling in gaps from image
  return {
    title: descriptionData.title || imageData.title || "Item",
    category: descriptionData.category || imageData.category || "other",
    subcategory: descriptionData.subcategory || imageData.subcategory,
    attributes: {
      brand: descriptionData.attributes.brand || imageData.attributes?.brand,
      model: descriptionData.attributes.model || imageData.attributes?.model,
      color: descriptionData.attributes.color || imageData.attributes?.color,
    },
  };
}

// Helper to convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
