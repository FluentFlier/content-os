import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const BUCKET = 'post-media';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size: ${MAX_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const client = getServerClient();
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    const { data, error } = await client.storage
      .from(BUCKET)
      .upload(fileName, file);

    if (error) {
      console.error('[Upload] Storage error:', error);
      return NextResponse.json(
        { error: 'Upload failed. Make sure the post-media bucket exists in InsForge.' },
        { status: 500 }
      );
    }

    const fileKey = data?.key ?? fileName;
    const publicUrl = client.storage.from(BUCKET).getPublicUrl(fileKey);

    return NextResponse.json({
      url: typeof publicUrl === 'string' ? publicUrl : (publicUrl as { data?: { publicUrl?: string } })?.data?.publicUrl ?? '',
      path: fileKey,
      size: file.size,
      type: file.type,
    });
  } catch (err) {
    console.error('[Upload] Unexpected error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
