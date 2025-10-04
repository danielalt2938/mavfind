import OpenAI from "openai";
import { TranscriptionResult } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

export async function transcribeAudio(
  audioFile: File
): Promise<TranscriptionResult> {
  try {
    // Convert File to the format OpenAI expects
    const fileBuffer = await audioFile.arrayBuffer();
    const blob = new Blob([fileBuffer], { type: audioFile.type });

    // Create a File object for OpenAI
    const file = new File([blob], audioFile.name, { type: audioFile.type });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "en",
    });

    return {
      text: transcription.text,
    };
  } catch (error) {
    console.error("Error transcribing audio with Whisper:", error);
    throw new Error("Failed to transcribe audio");
  }
}
