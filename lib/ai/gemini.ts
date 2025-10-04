import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIExtractedAttributes } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy-key");

export async function extractAttributesFromDescription(
  description: string
): Promise<AIExtractedAttributes> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
You are an AI assistant that extracts structured information from lost and found item descriptions.

Given the following description of a lost or found item, extract the following attributes:
- category (e.g., electronics, bags, clothing, accessories, documents, keys, etc.)
- brand (if mentioned)
- model (if mentioned)
- color (if mentioned)
- any other relevant attributes

Description: "${description}"

Respond in JSON format with the following structure:
{
  "category": "string",
  "brand": "string or null",
  "model": "string or null",
  "color": "string or null",
  "additionalAttributes": {
    "key": "value"
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

    return {
      category: extracted.category || "other",
      brand: extracted.brand || undefined,
      model: extracted.model || undefined,
      color: extracted.color || undefined,
      additionalAttributes: extracted.additionalAttributes || {},
    };
  } catch (error) {
    console.error("Error extracting attributes with Gemini:", error);
    // Return default values on error
    return {
      category: "other",
      additionalAttributes: {},
    };
  }
}

export async function extractAttributesFromImage(
  imageUrl: string
): Promise<Partial<AIExtractedAttributes>> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
Analyze this image of a lost or found item and extract:
- category (e.g., electronics, bags, clothing, accessories, documents, keys, etc.)
- brand (if visible)
- model (if visible)
- color
- any other distinctive features

Respond in JSON format:
{
  "category": "string",
  "brand": "string or null",
  "model": "string or null",
  "color": "string or null",
  "additionalAttributes": {
    "key": "value"
  }
}
`;

    // Note: This is a simplified version. In production, you'd need to properly
    // fetch and format the image for Gemini Vision API
    const result = await model.generateContent([prompt]);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from AI response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error extracting attributes from image:", error);
    return {};
  }
}
