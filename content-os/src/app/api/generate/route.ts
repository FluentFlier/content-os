import { NextRequest, NextResponse } from "next/server";
import { getServerInsforge } from "@/lib/insforge/server";
import { generateContent } from "@/lib/claude";
import { buildSystemPrompt } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const insforge = getServerInsforge();

    // Verify user is authenticated
    const { data: userData } = await insforge.auth.getCurrentUser();
    if (!userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = userData.user.id;
    const body = await request.json();
    const { prompt, systemOverride } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Build dynamic system prompt from creator profile
    let systemPrompt: string | undefined = systemOverride;

    if (!systemPrompt) {
      // Try to load creator profile for dynamic prompt
      const { data: profile } = await insforge.database
        .from("creator_profile")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profile) {
        systemPrompt = buildSystemPrompt(profile);
      }

      // Append context additions if any
      const { data: settings } = await insforge.database
        .from("user_settings")
        .select("value")
        .eq("user_id", userId)
        .eq("key", "context_additions")
        .single();

      if (settings?.value) {
        systemPrompt = systemPrompt
          ? `${systemPrompt}\n\nADDITIONAL CONTEXT:\n${settings.value}`
          : settings.value;
      }
    }

    const text = await generateContent(prompt, systemPrompt);

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
