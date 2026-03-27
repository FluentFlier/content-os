import { NextRequest, NextResponse } from "next/server";
import { getServerInsforge } from "@/lib/insforge/server";
import { postTweet, postThread } from "@/lib/platforms/twitter";
import { postToLinkedIn } from "@/lib/platforms/linkedin";
import type { PlatformConfig } from "@/types/database";

interface DistributeBody {
  postId: string;
  platforms: {
    twitter?: { caption: string };
    linkedin?: { caption: string };
    instagram?: { caption: string };
  };
}

/**
 * Split text into tweet-sized chunks on sentence boundaries.
 * Each chunk stays under 280 characters.
 */
function splitIntoTweets(text: string): string[] {
  if (text.length <= 280) return [text];

  const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
  const tweets: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!current) {
      current = trimmed;
    } else if ((current + " " + trimmed).length <= 280) {
      current += " " + trimmed;
    } else {
      tweets.push(current);
      current = trimmed;
    }
  }
  if (current) tweets.push(current);

  // If any single chunk is still over 280, hard-split on word boundaries
  const final: string[] = [];
  for (const tweet of tweets) {
    if (tweet.length <= 280) {
      final.push(tweet);
    } else {
      const words = tweet.split(" ");
      let chunk = "";
      for (const word of words) {
        if (!chunk) {
          chunk = word;
        } else if ((chunk + " " + word).length <= 280) {
          chunk += " " + word;
        } else {
          final.push(chunk);
          chunk = word;
        }
      }
      if (chunk) final.push(chunk);
    }
  }

  return final;
}

export async function POST(request: NextRequest) {
  try {
    const insforge = getServerInsforge();

    const { data: userData } = await insforge.auth.getCurrentUser();
    if (!userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = userData.user.id;

    const body: DistributeBody = await request.json();
    const { postId, platforms } = body;

    if (!postId || !platforms) {
      return NextResponse.json(
        { error: "postId and platforms are required" },
        { status: 400 }
      );
    }

    // Verify post ownership
    const { data: post, error: postError } = await insforge.database
      .from("posts")
      .select("*")
      .eq("id", postId)
      .eq("user_id", userId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Fetch creator profile for platform configs
    const { data: profile, error: profileError } = await insforge.database
      .from("creator_profiles")
      .select("platform_config")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Creator profile not found. Complete onboarding first." },
        { status: 400 }
      );
    }

    const platformConfig: PlatformConfig = profile.platform_config;
    const results: Record<string, { success: boolean; id?: string; error?: string }> = {};

    // --- Twitter ---
    if (platforms.twitter) {
      try {
        const xConfig = platformConfig.x;
        if (!xConfig?.enabled || !xConfig.apiKey) {
          throw new Error("Twitter/X not configured. Add API keys in settings.");
        }

        const caption = platforms.twitter.caption;
        const twitterCreds = {
          apiKey: xConfig.apiKey,
          apiSecret: xConfig.apiSecret,
          accessToken: xConfig.accessToken,
          accessSecret: xConfig.accessSecret,
        };

        if (caption.length > 280) {
          const tweets = splitIntoTweets(caption);
          const { ids } = await postThread(twitterCreds, tweets);
          results.twitter = { success: true, id: ids[0] };

          // Save distribution record
          await insforge.database.from("post_distributions").insert({
            post_id: postId,
            platform: "twitter",
            platform_post_id: ids[0],
            optimized_caption: caption,
            status: "posted",
            posted_at: new Date().toISOString(),
          });
        } else {
          const { id } = await postTweet(twitterCreds, caption);
          results.twitter = { success: true, id };

          await insforge.database.from("post_distributions").insert({
            post_id: postId,
            platform: "twitter",
            platform_post_id: id,
            optimized_caption: caption,
            status: "posted",
            posted_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.twitter = { success: false, error: message };

        await insforge.database.from("post_distributions").insert({
          post_id: postId,
          platform: "twitter",
          optimized_caption: platforms.twitter.caption,
          status: "failed",
        });
      }
    }

    // --- LinkedIn ---
    if (platforms.linkedin) {
      try {
        const liConfig = platformConfig.linkedin;
        if (!liConfig?.enabled || !liConfig.accessToken) {
          throw new Error("LinkedIn not configured. Add credentials in settings.");
        }

        const { id } = await postToLinkedIn(
          { accessToken: liConfig.accessToken, personId: liConfig.personId },
          platforms.linkedin.caption
        );
        results.linkedin = { success: true, id };

        await insforge.database.from("post_distributions").insert({
          post_id: postId,
          platform: "linkedin",
          platform_post_id: id,
          optimized_caption: platforms.linkedin.caption,
          status: "posted",
          posted_at: new Date().toISOString(),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.linkedin = { success: false, error: message };

        await insforge.database.from("post_distributions").insert({
          post_id: postId,
          platform: "linkedin",
          optimized_caption: platforms.linkedin.caption,
          status: "failed",
        });
      }
    }

    // --- Instagram (manual -- just save the distribution record) ---
    if (platforms.instagram) {
      await insforge.database.from("post_distributions").insert({
        post_id: postId,
        platform: "instagram",
        optimized_caption: platforms.instagram.caption,
        status: "draft",
      });
      results.instagram = { success: true, id: "manual" };
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[api/distribute] Error:", error);
    return NextResponse.json(
      { error: "Distribution failed" },
      { status: 500 }
    );
  }
}
