import { TranscriptionResult } from "@/types";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "dummy-key";

export async function transcribeAudio(
  audioFile: File
): Promise<TranscriptionResult> {
  try {
    const formData = new FormData();
    formData.append("audio", audioFile);
    formData.append("model_id", "scribe_v1"); // ElevenLabs Scribe model

    const response = await fetch("https://api.elevenlabs.io/v1/audio-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API error: ${error}`);
    }

    const data = await response.json();

    return {
      text: data.text || "",
    };
  } catch (error) {
    console.error("Error transcribing audio with ElevenLabs:", error);
    throw new Error("Failed to transcribe audio");
  }
}
