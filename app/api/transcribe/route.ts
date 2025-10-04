import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/ai/whisper";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 }
      );
    }

    // Transcribe audio using Whisper
    const transcription = await transcribeAudio(audioFile);

    return NextResponse.json({ text: transcription.text }, { status: 200 });
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
