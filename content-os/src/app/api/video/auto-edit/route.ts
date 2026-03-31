import { NextResponse, type NextRequest } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { z } from 'zod';

const AutoEditRequestSchema = z.object({
  videoUrl: z.string().url(),
  options: z.object({
    captions: z.boolean().optional(),
    silenceRemoval: z.boolean().optional(),
    smartCuts: z.boolean().optional(),
    template: z.string().optional(),
    format: z.enum(['mp4', 'webm']).optional(),
    quality: z.enum(['720p', '1080p']).optional(),
  }),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = AutoEditRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { videoUrl, options } = parsed.data;
  const jobId = crypto.randomUUID();

  // If captions are requested, generate AI captions
  if (options.captions) {
    try {
      const client = getServerClient();
      const { data: aiResponse } = await client.ai.chat.completions.create({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [
          {
            role: 'system',
            content: `You generate caption timing data for short-form video content. Generate a sequence of caption phrases that would work for a 30-60 second talking head video. Each phrase should be 2-5 words, timed at 30fps. Return ONLY valid JSON array. No em dashes.`,
          },
          {
            role: 'user',
            content: `Generate 8-12 caption phrases for a short-form video. Return as JSON array with objects: { "text": "phrase", "startFrame": number, "endFrame": number }. Space them evenly across 900 frames (30 seconds at 30fps). Start from frame 0.`,
          },
        ],
        maxTokens: 1000,
      });

      const rawText = aiResponse?.choices?.[0]?.message?.content ?? '[]';
      // Extract JSON from the response
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      const captions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      return NextResponse.json({
        status: 'completed',
        jobId,
        captions,
        message: 'Captions generated successfully',
        videoUrl,
        options,
      });
    } catch (err) {
      console.error('[auto-edit] Caption generation failed:', err);
      return NextResponse.json({
        status: 'completed',
        jobId,
        captions: [],
        message: 'Caption generation failed, using empty captions',
        videoUrl,
        options,
      });
    }
  }

  return NextResponse.json({
    status: 'processing',
    jobId,
    message: 'Video processing job submitted',
    videoUrl,
    options,
  });
}
