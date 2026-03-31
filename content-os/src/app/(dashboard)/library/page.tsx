'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Grid3X3, List, Plus, Search, Trash2, ChevronDown } from 'lucide-react';
import type { Post, Series } from '@/lib/types';
import type { Platform, Status } from '@/lib/constants';
import { PLATFORMS, STATUSES, STATUS_LABELS } from '@/lib/constants';
import { getInsforgeClient } from '@/lib/insforge/client';
import { usePillars } from '@/hooks/usePillars';
import PostGrid from '@/components/library/PostGrid';
import PostTable from '@/components/library/PostTable';
import PostEditorDrawer from '@/components/library/PostEditorDrawer';

export default function LibraryPage() {
  const { pillars: pillarList, getLabel } = usePillars();
  const [posts, setPosts] = useState<Post[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // View
  const [view, setView] = useState<'card' | 'table'>('card');

  // Filters
  const [search, setSearch] = useState('');
  const [pillarFilter, setPillarFilter] = useState<string | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [seriesFilter, setSeriesFilter] = useState<string | 'all'>('all');

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Editor drawer
  const [editorPost, setEditorPost] = useState<Post | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const client = getInsforgeClient();
      const { data: userData } = await client.auth.getCurrentUser();
      if (!userData?.user) return;
      const uid = userData.user.id;
      setUserId(uid);

      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts((data.posts as Post[]) ?? []);
      }

      const { data: seriesData } = await client.database
        .from('series')
        .select('*')
        .eq('user_id', uid)
        .order('name', { ascending: true });

      setSeries((seriesData as Series[]) ?? []);
    } catch (err) {
      console.error('Failed to fetch library data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side filtering
  const filtered = useMemo(() => {
    let result = posts;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || (p.script && p.script.toLowerCase().includes(q))
      );
    }
    if (pillarFilter !== 'all') result = result.filter((p) => p.pillar === pillarFilter);
    if (platformFilter !== 'all') result = result.filter((p) => p.platform === platformFilter);
    if (statusFilter !== 'all') result = result.filter((p) => p.status === statusFilter);
    if (seriesFilter !== 'all') result = result.filter((p) => p.series_id === seriesFilter);
    return result;
  }, [posts, search, pillarFilter, platformFilter, statusFilter, seriesFilter]);

  // Selection
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (!userId || selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} post(s)?`)) return;
    const ids = Array.from(selected);
    await Promise.all(
      ids.map((id) => fetch(`/api/posts/${id}`, { method: 'DELETE' }))
    );
    setSelected(new Set());
    fetchData();
  };

  const handleBulkStatus = async (status: Status) => {
    if (!userId || selected.size === 0) return;
    const ids = Array.from(selected);
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/posts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
        })
      )
    );
    setSelected(new Set());
    fetchData();
  };

  // New post
  const handleNewPost = async () => {
    if (!userId) return;
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Untitled',
        pillar: pillarList[0]?.value || 'general',
        platform: 'instagram',
        status: 'idea',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      await fetchData();
      setEditorPost(data.post as Post);
      setEditorOpen(true);
    }
  };

  // Editor
  const openEditor = (post: Post) => {
    setEditorPost(post);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditorPost(null);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-[#18181B] rounded-[7px] animate-pulse" />
          <div className="h-9 w-28 bg-[#18181B] rounded-[7px] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-[#18181B] rounded-[12px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-heading text-[22px] font-[800] text-[#FAFAFA] leading-[1.2] tracking-[-0.02em]">Library</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[150px] sm:flex-none">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.08)] rounded-[7px] pl-8 pr-3 py-2 min-h-[44px] text-[13px] text-[#FAFAFA] placeholder:text-[#71717A] focus:outline-none focus:border-[#FAFAFA]/40 w-full sm:w-56 transition-colors"
            />
          </div>
          {/* View toggle */}
          <button
            onClick={() => setView('card')}
            className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[7px] border-[0.5px] transition-all duration-100 ${
              view === 'card' ? 'border-[#6366F1] text-[#6366F1]' : 'border-[#FAFAFA]/12 text-[#71717A] hover:text-[#FAFAFA]'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('table')}
            className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[7px] border-[0.5px] transition-all duration-100 ${
              view === 'table' ? 'border-[#6366F1] text-[#6366F1]' : 'border-[#FAFAFA]/12 text-[#71717A] hover:text-[#FAFAFA]'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          {/* New Post */}
          <button
            onClick={handleNewPost}
            className="flex items-center gap-1.5 bg-[#6366F1] text-white text-[13px] font-medium px-5 py-[10px] min-h-[44px] rounded-[7px] hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Post</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2">
        <FilterDropdown
          label="Pillar"
          value={pillarFilter}
          onChange={(v) => setPillarFilter(v)}
          options={[{ value: 'all', label: 'All' }, ...pillarList.map((p) => ({ value: p.value, label: p.label }))]}
        />
        <FilterDropdown
          label="Platform"
          value={platformFilter}
          onChange={(v) => setPlatformFilter(v as Platform | 'all')}
          options={[{ value: 'all', label: 'All' }, ...PLATFORMS.map((p) => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))]}
        />
        <FilterDropdown
          label="Status"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as Status | 'all')}
          options={[{ value: 'all', label: 'All' }, ...STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))]}
        />
        {series.length > 0 && (
          <FilterDropdown
            label="Series"
            value={seriesFilter}
            onChange={(v) => setSeriesFilter(v)}
            options={[{ value: 'all', label: 'All' }, ...series.map((s) => ({ value: s.id, label: s.name }))]}
          />
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] px-4 py-2">
          <span className="text-[13px] text-[#71717A]">{selected.size} selected</span>
          <button onClick={handleBulkDelete} className="flex items-center gap-1 text-[13px] text-[#6366F1] hover:opacity-80">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <div className="relative group">
            <button className="flex items-center gap-1 text-[13px] text-[#71717A] hover:text-[#FAFAFA]">
              Change Status <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <div className="absolute top-full left-0 mt-1 bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] py-1 hidden group-hover:block z-20">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleBulkStatus(s)}
                  className="block w-full text-left px-4 py-1.5 text-[13px] text-[#FAFAFA] hover:bg-[#18181B] capitalize"
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {posts.length === 0 && (
            <FileText className="w-12 h-12 text-[#71717A] mb-4" />
          )}
          <h2 className="font-heading text-[16px] font-[700] text-[#FAFAFA] mb-1">
            {posts.length === 0 ? 'Nothing scripted yet' : 'No posts match your filters'}
          </h2>
          <p className="text-[#71717A] text-[13px] mb-4">
            {posts.length === 0 ? 'Generate a script or convert an idea to get started.' : 'Try adjusting your filters.'}
          </p>
          {posts.length === 0 && (
            <a
              href="/generate"
              className="flex items-center gap-1.5 bg-[#6366F1] text-white text-[13px] font-medium px-5 py-[10px] rounded-[7px] hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Generate a Script
            </a>
          )}
        </div>
      ) : view === 'card' ? (
        <PostGrid
          posts={filtered}
          selected={selected}
          onSelect={toggleSelect}
          onClickPost={openEditor}
        />
      ) : (
        <PostTable
          posts={filtered}
          selected={selected}
          onSelect={toggleSelect}
          onSelectAll={toggleSelectAll}
          onClickPost={openEditor}
        />
      )}

      {/* Post Editor Drawer */}
      {editorOpen && editorPost && (
        <PostEditorDrawer
          post={editorPost}
          series={series}
          onClose={closeEditor}
          onSave={fetchData}
          onDelete={() => { closeEditor(); fetchData(); }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter Dropdown
// ---------------------------------------------------------------------------

function FilterDropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] pl-3 pr-7 py-2 min-h-[44px] text-[13px] text-[#FAFAFA] focus:outline-none focus:border-[#FAFAFA]/40 cursor-pointer transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {label}: {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71717A] pointer-events-none" />
    </div>
  );
}
