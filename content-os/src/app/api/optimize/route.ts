import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { generateContent } from '@/lib/claude';
import type { CreatorProfileForPrompt } from '@/lib/claude';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const PLATFORM_ENUM = z.enum(['twitter', 'linkedin', 'instagram', 'threads']);

const OptimizeSchema = z.object({
  content: z.string().min(1, 'Content is required').max(25000),
  sourcePlatform: PLATFORM_ENUM,
  targetPlatforms: z.array(PLATFORM_ENUM).min(1, 'At least one target platform is required'),
  postId: z.string().uuid().optional(),
  optimizationLevel: z.enum(['light', 'full']).default('full'),
});

type PlatformType = z.infer<typeof PLATFORM_ENUM>;

interface Variant {
  platform: PlatformType;
  content: string;
  characterCount: number;
  isThread: boolean;
  threadParts: string[] | null;
}

const PLATFORM_LIMITS: Record<PlatformType, number> = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
  threads: 500,
};

function buildOptimizationPrompt(
  platform: PlatformType,
  content: string,
  level: 'light' | 'full'
): string {
  const intensity = level === 'light'
    ? 'Make minimal changes. Keep the original structure and tone as much as possible.'
    : 'Fully rewrite and optimize for this platform. Adapt tone, structure, and format.';

  switch (platform) {
    case 'twitter':
      return [
        `Optimize the following content for Twitter. ${intensity}`,
        '',
        'RULES:',
        '- Each tweet MUST be 280 characters or fewer.',
        '- If the content is short enough, write a single tweet.',
        '- If the content needs multiple tweets to cover properly, split into a thread.',
        '- Separate each tweet in a thread with the delimiter ---TWEET--- on its own line.',
        '- Each tweet in the thread must stand alone but connect to the narrative.',
        '- Use punchy, direct language. No filler.',
        '- No em dashes. Use hyphens or rewrite.',
        '- Do NOT include tweet numbering (1/, 2/, etc.) - just the content.',
        '',
        `ORIGINAL CONTENT:\n${content}`,
        '',
        'Write the optimized tweet(s). If multiple tweets, separate with ---TWEET--- on its own line.',
      ].join('\n');

    case 'linkedin':
      return [
        `Optimize the following content for LinkedIn. ${intensity}`,
        '',
        'RULES:',
        '- Maximum 3000 characters.',
        '- Professional but human tone.',
        '- Use line breaks for readability.',
        '- Start with a strong hook line.',
        '- End with a question or call to action to drive engagement.',
        '- No em dashes. Use hyphens or rewrite.',
        '',
        `ORIGINAL CONTENT:\n${content}`,
        '',
        'Write the optimized LinkedIn post.',
      ].join('\n');

    case 'instagram':
      return [
        `Optimize the following content as an Instagram caption. ${intensity}`,
        '',
        'RULES:',
        '- Maximum 2200 characters.',
        '- Caption format: hook line, body, then hashtags at the end.',
        '- Include 5-10 relevant hashtags at the bottom, separated from caption by two line breaks.',
        '- Conversational, authentic tone.',
        '- Use emojis sparingly if they fit.',
        '- No em dashes. Use hyphens or rewrite.',
        '',
        `ORIGINAL CONTENT:\n${content}`,
        '',
        'Write the optimized Instagram caption with hashtags.',
      ].join('\n');

    case 'threads':
      return [
        `Optimize the following content for Threads. ${intensity}`,
        '',
        'RULES:',
        '- Maximum 500 characters.',
        '- Conversational, casual tone.',
        '- Short and punchy.',
        '- Think of it like a text to a friend who is interested in this topic.',
        '- No em dashes. Use hyphens or rewrite.',
        '',
        `ORIGINAL CONTENT:\n${content}`,
        '',
        'Write the optimized Threads post.',
      ].join('\n');
  }
}

function processTwitterContent(content: string): Variant {
  const trimmed = content.trim();

  // Check if the AI returned multiple tweets using the delimiter
  if (trimmed.includes('---TWEET---')) {
    let parts = trimmed
      .split('---TWEET---')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Validate each part <= 280 chars; split oversized parts
    const validatedParts: string[] = [];
    for (const part of parts) {
      if (part.length <= 280) {
        validatedParts.push(part);
      } else {
        validatedParts.push(...splitIntoTweets(part));
      }
    }
    parts = validatedParts;

    if (parts.length > 1) {
      const joined = parts.join('\n---TWEET---\n');
      return {
        platform: 'twitter',
        content: joined,
        characterCount: joined.length,
        isThread: true,
        threadParts: parts,
      };
    }
  }

  // Single tweet - check if it exceeds limit
  if (trimmed.length <= 280) {
    return {
      platform: 'twitter',
      content: trimmed,
      characterCount: trimmed.length,
      isThread: false,
      threadParts: null,
    };
  }

  // Content is over 280 chars but AI did not thread it - manually split
  const parts = splitIntoTweets(trimmed);
  return {
    platform: 'twitter',
    content: parts.join('\n---TWEET---\n'),
    characterCount: parts.join('\n---TWEET---\n').length,
    isThread: true,
    threadParts: parts,
  };
}

/**
 * Splits long text into tweet-sized chunks (<=280 chars each).
 * Tries to split at sentence boundaries, then at word boundaries.
 */
function splitIntoTweets(text: string): string[] {
  const maxLen = 280;
  const tweets: string[] = [];
  let remaining = text.trim();

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      tweets.push(remaining);
      break;
    }

    // Try to split at sentence boundary within limit
    let splitIndex = -1;
    const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
    for (const ender of sentenceEnders) {
      const idx = remaining.lastIndexOf(ender, maxLen - 1);
      if (idx > 0 && idx > splitIndex) {
        splitIndex = idx + ender.length - 1; // include the punctuation
      }
    }

    // Fall back to word boundary
    if (splitIndex <= 0) {
      splitIndex = remaining.lastIndexOf(' ', maxLen - 1);
    }

    // Last resort: hard split
    if (splitIndex <= 0) {
      splitIndex = maxLen;
    }

    tweets.push(remaining.slice(0, splitIndex).trim());
    remaining = remaining.slice(splitIndex).trim();
  }

  return tweets;
}

/**
 * Truncates content to the platform character limit.
 * Tries to truncate at word boundary, falls back to hard cut with ellipsis.
 */
function truncateToLimit(text: string, limit: number): string {
  if (text.length <= limit) return text;
  // Try to truncate at last space before limit (leave room for ellipsis)
  const cutoff = limit - 1;
  const lastSpace = text.lastIndexOf(' ', cutoff);
  if (lastSpace > limit * 0.5) {
    return text.slice(0, lastSpace).trimEnd() + '\u2026';
  }
  return text.slice(0, cutoff) + '\u2026';
}

function processStandardContent(
  platform: PlatformType,
  content: string
): Variant {
  const trimmed = content.trim();
  const limit = PLATFORM_LIMITS[platform];
  const truncated = truncateToLimit(trimmed, limit);
  return {
    platform,
    content: truncated,
    characterCount: truncated.length,
    isThread: false,
    threadParts: null,
  };
}

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
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = OptimizeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { content, targetPlatforms, optimizationLevel } = parsed.data;

  // Load user's creator profile for personalized prompts
  const client = await getServerClient();
  let profile: CreatorProfileForPrompt | null = null;
  try {
    const { data: profileRow } = await client.database
      .from('creator_profile')
      .select('display_name, bio, content_pillars, voice_description, voice_rules')
      .eq('user_id', user.id)
      .single();

    if (profileRow) {
      const contentPillars =
        typeof profileRow.content_pillars === 'string'
          ? JSON.parse(profileRow.content_pillars)
          : profileRow.content_pillars;

      profile = {
        display_name: profileRow.display_name,
        bio: profileRow.bio ?? undefined,
        content_pillars: contentPillars,
        voice_description: profileRow.voice_description ?? undefined,
        voice_rules: profileRow.voice_rules ?? undefined,
      };
    }
  } catch {
    // No profile found - will use default prompt
  }

  // Generate optimized content for each target platform in parallel.
  const settled = await Promise.allSettled(
    targetPlatforms.map(async (platform) => {
      const prompt = buildOptimizationPrompt(platform, content, optimizationLevel);
      const generated = await generateContent(prompt, undefined, undefined, profile);
      const cleaned = generated.replace(/\u2014/g, ' - ').replace(/\u2013/g, '-');
      return platform === 'twitter'
        ? processTwitterContent(cleaned)
        : processStandardContent(platform, cleaned);
    }),
  );

  const variants: Variant[] = [];
  const errors: { platform: PlatformType; error: string }[] = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      variants.push(r.value);
    } else {
      const message = r.reason instanceof Error ? r.reason.message : 'Generation failed';
      errors.push({ platform: targetPlatforms[i], error: message });
    }
  });

  // If all platforms failed, return 500
  if (variants.length === 0 && errors.length > 0) {
    return NextResponse.json(
      { error: 'All platform optimizations failed', details: errors },
      { status: 500 }
    );
  }

  return NextResponse.json({
    variants,
    ...(errors.length > 0 ? { errors } : {}),
  });
}
