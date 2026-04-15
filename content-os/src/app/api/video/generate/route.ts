import { NextResponse, type NextRequest } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const GenerateVideoSchema = z.object({
  prompt: z.string().min(1).max(2000),
  template: z.enum([
    'talking-head-captions',
    'hook-content',
    'story-highlights',
    'stats-overlay',
    'before-after',
  ]),
  duration: z.number().min(5).max(120).optional(),
}).strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = checkRateLimit(user.id);
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = GenerateVideoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { prompt, template, duration = 30 } = parsed.data;
  const fps = 30;
  const totalFrames = duration * fps;

  try {
    const client = await getServerClient();

    // Generate composition data based on template
    let systemPrompt = '';
    let userPrompt = '';

    switch (template) {
      case 'talking-head-captions':
        systemPrompt = 'You generate caption timing data for videos. Return ONLY valid JSON. No em dashes.';
        userPrompt = `Based on this prompt, generate caption phrases for a ${duration}-second video at ${fps}fps (${totalFrames} frames total). Return JSON array of { "text": "2-5 word phrase", "startFrame": number, "endFrame": number }.\n\nPrompt: ${prompt}`;
        break;
      case 'hook-content':
        systemPrompt = 'You write punchy video hooks. Return ONLY a JSON object. No em dashes.';
        userPrompt = `Write a hook for this video concept. Return JSON: { "hookText": "the hook text (max 10 words)", "hookDurationFrames": ${Math.min(90, Math.round(totalFrames * 0.3))} }\n\nConcept: ${prompt}`;
        break;
      case 'stats-overlay':
        systemPrompt = 'You generate statistics for video overlays. Return ONLY valid JSON. No em dashes.';
        userPrompt = `Generate 3-5 relevant statistics for this topic. Return JSON array of { "label": "metric name", "value": "formatted number", "startFrame": number }. Space them across ${totalFrames} frames.\n\nTopic: ${prompt}`;
        break;
      default:
        return NextResponse.json({
          compositionData: {},
          template,
          totalFrames,
          fps,
          message: `Template "${template}" requires manual clip selection. Upload clips and apply the template in the editor.`,
        });
    }

    // SDK returns the completion object directly. Destructuring { data }
    // silently yields undefined and every caller of this route was getting
    // back an empty compositionData object as a result.
    const aiResponse = await client.ai.chat.completions.create({
      model: 'anthropic/claude-sonnet-4.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      maxTokens: 1500,
    });

    const rawText = aiResponse?.choices?.[0]?.message?.content ?? '{}';
    const jsonMatch = rawText.match(/[\[{][\s\S]*[\]}]/);
    let compositionData: unknown = {};
    if (jsonMatch) {
      try {
        compositionData = JSON.parse(jsonMatch[0]);
      } catch {
        return NextResponse.json(
          { error: 'Model returned invalid JSON' },
          { status: 502 },
        );
      }
    }

    return NextResponse.json({
      compositionData,
      template,
      totalFrames,
      fps,
      message: 'Composition data generated. Apply a video and preview in the editor.',
    });
  } catch (err) {
    console.error('[video/generate] AI generation failed:', err);
    return NextResponse.json(
      { error: 'Failed to generate video composition data' },
      { status: 500 },
    );
  }
}
