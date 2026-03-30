import { NextResponse, type NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/insforge/server';
import { z } from 'zod';

const AutoEditRequestSchema = z.object({
  videoUrl: z.string().url(),
  options: z.object({
    captions: z.boolean().optional(),
    silenceRemoval: z.boolean().optional(),
    smartCuts: z.boolean().optional(),
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

  // Placeholder response - will connect to ZapCap or similar backend later
  return NextResponse.json({
    status: 'processing',
    jobId: crypto.randomUUID(),
    message: 'Video processing is not yet connected to a backend service',
    request: {
      videoUrl: parsed.data.videoUrl,
      options: parsed.data.options,
      userId: user.id,
    },
  });
}
