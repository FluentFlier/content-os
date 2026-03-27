import { NextRequest, NextResponse } from "next/server";
import { getServerInsforge } from "@/lib/insforge/server";
import { generateContent } from "@/lib/claude";

interface OptimizeBody {
  postId: string;
  script: string;
  caption: string;
  platforms: string[];
}

const PLATFORM_PROMPTS: Record<string, string> = {
  twitter: `Adapt this for X/Twitter. Under 280 chars if possible, or split into a thread. Punchy, minimal hashtags. No em dashes. Return ONLY the adapted text, nothing else.`,
  linkedin: `Adapt this for LinkedIn. Professional but authentic tone. Can be longer. Reflective framing. Relevant hashtags. No em dashes. Return ONLY the adapted text, nothing else.`,
  instagram: `Optimize this Instagram caption. Hook-first (shown before 'more'). 2-4 sentences. Direct question at end. 20-25 hashtags after blank line. No em dashes. Return ONLY the adapted caption, nothing else.`,
};

export async function POST(request: NextRequest) {
  try {
    const insforge = getServerInsforge();

    const { data: userData } = await insforge.auth.getCurrentUser();
    if (!userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: OptimizeBody = await request.json();
    const { script, caption, platforms } = body;

    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: "At least one platform is required" },
        { status: 400 }
      );
    }

    const source = script || caption;
    if (!source) {
      return NextResponse.json(
        { error: "Script or caption is required" },
        { status: 400 }
      );
    }

    const results: Record<string, string> = {};

    // Run all platform optimizations concurrently
    const promises = platforms.map(async (platform) => {
      const prompt = PLATFORM_PROMPTS[platform];
      if (!prompt) return;

      const userPrompt = `Here is the content to adapt:\n\n---\n${source}\n---\n\n${prompt}`;
      const optimized = await generateContent(userPrompt);
      results[platform] = optimized;
    });

    await Promise.all(promises);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[api/optimize] Error:", error);
    return NextResponse.json(
      { error: "Optimization failed" },
      { status: 500 }
    );
  }
}
