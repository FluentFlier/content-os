const BASE_URL = 'https://api.supermemory.ai/v3';

function getApiKey(): string {
  const key = process.env.SUPERMEMORY_API_KEY;
  if (!key) throw new Error('Missing SUPERMEMORY_API_KEY env var');
  return key;
}

async function smFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`Supermemory API error (${res.status}): ${text}`);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export interface AddMemoryParams {
  content: string;
  containerTags?: string[];
  customId?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface MemoryDocument {
  id: string;
  title?: string;
  summary?: string;
  status?: string;
  customId?: string;
  containerTags?: string[];
  metadata?: Record<string, string | number | boolean>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchResult {
  id: string;
  score: number;
  content?: string;
  metadata?: Record<string, string | number | boolean>;
  documentId?: string;
}

export async function addMemory(params: AddMemoryParams): Promise<MemoryDocument> {
  return smFetch<MemoryDocument>('/documents', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function searchMemories(
  query: string,
  containerTags?: string[],
  limit = 5
): Promise<{ results: SearchResult[] }> {
  return smFetch<{ results: SearchResult[] }>('/search', {
    method: 'POST',
    body: JSON.stringify({
      q: query,
      containerTags,
      topK: limit,
    }),
  });
}

export async function listMemories(
  containerTags?: string[],
  limit = 20,
  page = 1
): Promise<{ memories: MemoryDocument[] }> {
  return smFetch<{ memories: MemoryDocument[] }>('/documents/list', {
    method: 'POST',
    body: JSON.stringify({ containerTags, limit, page }),
  });
}

export async function deleteMemory(id: string): Promise<void> {
  await smFetch<void>(`/documents/${id}`, { method: 'DELETE' });
}

/**
 * Store a user's persona in Supermemory for semantic retrieval.
 * containerTags scopes it to the user. customId prevents duplicates.
 */
export async function storePersona(
  userId: string,
  personaContent: string,
  metadata?: Record<string, string | number | boolean>
): Promise<MemoryDocument> {
  return addMemory({
    content: personaContent,
    containerTags: [`user_${userId}`, 'persona'],
    customId: `persona_${userId}`,
    metadata: { type: 'persona', userId, ...metadata },
  });
}

/**
 * Search a user's stored memories for context relevant to content generation.
 */
export async function searchUserContext(
  userId: string,
  query: string,
  limit = 5
): Promise<SearchResult[]> {
  const { results } = await searchMemories(query, [`user_${userId}`], limit);
  return results;
}
