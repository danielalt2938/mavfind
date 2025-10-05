import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Chatbot system prompt/preprompt - customize this with your MavFind information
const SYSTEM_PROMPT = `You are MavBot, a helpful AI assistant for MavFind - a lost and found platform for UTA (University of Texas at Arlington) campus.

Your role is to help users with:
- Understanding how to report lost items
- Learning how to submit found items
- Explaining how the matching system works
- Answering questions about the platform features
- Providing guidance on claiming items
- General questions about the lost and found process

Key Information about MavFind:
- MavFind uses AI-powered matching to connect lost items with found items
- Users can report lost items using voice, text, or image descriptions
- The system automatically matches lost items with found items in inventory
- Email notifications are sent when potential matches are found
- Both students and staff can use the platform
- Items are categorized (electronics, bags, keys, clothing, etc.)
- Location information helps improve matching accuracy

Guidelines:
- Be friendly, helpful, and concise
- If you don't know something specific about MavFind, be honest
- Encourage users to contact support for urgent matters
- Keep responses brief and to the point (2-4 sentences usually)
- Use clear, simple language
- Don't make up features or policies that don't exist

If asked about topics unrelated to MavFind or lost & found, politely redirect to your purpose.`;

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Chatbot service not configured" },
        { status: 503 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500, // Keep responses concise
      },
    });

    // Build conversation context
    const chatHistory = conversationHistory || [];
    const messages = [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: "model",
        parts: [{ text: "Hello! I'm MavBot, your MavFind assistant. How can I help you today?" }],
      },
      ...chatHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
    ];

    // Start chat session with history
    const chat = model.startChat({
      history: messages,
    });

    // Send the new message
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const reply = response.text();

    return NextResponse.json({
      reply,
      success: true,
    });
  } catch (error: any) {
    console.error("Chatbot error:", error);

    // Handle specific Gemini errors
    if (error.message?.includes("API key")) {
      return NextResponse.json(
        { error: "Chatbot service configuration error" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process message", details: error.message },
      { status: 500 }
    );
  }
}
