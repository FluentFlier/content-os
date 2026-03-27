import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, systemOverride, model } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const text = await generateContent(prompt, systemOverride || undefined, model || undefined);

    // Strip em dashes from AI output
    const cleaned = text.replace(/\u2014/g, " - ").replace(/\u2013/g, "-");

    return NextResponse.json({ text: cleaned });
  } catch (error) {
    console.error("[api/generate] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
