"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Grid3X3, List, Plus, Search, Trash2, ChevronDown, ArrowUpDown } from "lucide-react";
import { getInsforge } from "@/lib/insforge/client";
import type {
  Post,
  Pillar,
  Platform,
  PostStatus,
  Series,
} from "@/types/database";
import {
  ALL_PILLARS,
  ALL_PLATFORMS,
  ALL_STATUSES,
  PILLAR_LABELS,
} from "@/types/database";
import StatusBadge from "@/components/StatusBadge";
import PillarDot from "@/components/PillarDot";
import PostEditor from "@/components/PostEditor";

type SortKey = "title" | "pillar" | "platform" | "status" | "scheduled_date" | "views" | "saves";
type SortDir = "asc" | "desc";

export default function LibraryPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // View
  const [view, setView] = useState<"card" | "table">("card");

  // Filters
  const [search, setSearch] = useState("");
  const [pillarFilter, setPillarFilter] = useState<Pillar | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");
  const [seriesFilter, setSeriesFilter] = useState<string | "all">("all");

  // Sort (table)
  const [sortKey, setSortKey] = useState<SortKey>("scheduled_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Editor
  const [editorPost, setEditorPost] = useState<Post | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const insforge = getInsforge();
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (!userData?.user) return;
      const uid = userData.user.id;
      setUserId(uid);

      const [postsRes, seriesRes] = await Promise.all([
        insforge.database
          .from("posts")
          .select("*")
          .eq("user_id", uid)
          .order("updated_at", { ascending: false }),
        insforge.database
          .from("series")
          .select("*")
          .eq("user_id", uid)
          .order("name", { ascending: true }),
      ]);

      setPosts((postsRes.data as Post[]) ?? []);
      setSeries((seriesRes.data as Series[]) ?? []);
    } catch (err) {
      console.error("Failed to fetch library data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtering
  const filtered = useMemo(() => {
    let result = posts;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.script && p.script.toLowerCase().includes(q))
      );
    }
    if (pillarFilter !== "all") result = result.filter((p) => p.pillar === pillarFilter);
    if (platformFilter !== "all") result = result.filter((p) => p.platform === platformFilter);
    if (statusFilter !== "all") result = result.filter((p) => p.status === statusFilter);
    if (seriesFilter !== "all") result = result.filter((p) => p.series_id === seriesFilter);

    return result;
  }, [posts, search, pillarFilter, platformFilter, statusFilter, seriesFilter]);

  // Sorting (for table)
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: string | number | null = null;
      let bv: string | number | null = null;

      switch (sortKey) {
        case "title":
          av = a.title.toLowerCase();
          bv = b.title.toLowerCase();
          break;
        case "pillar":
          av = a.pillar;
          bv = b.pillar;
          break;
        case "platform":
          av = a.platform;
          bv = b.platform;
          break;
        case "status":
          av = ALL_STATUSES.indexOf(a.status);
          bv = ALL_STATUSES.indexOf(b.status);
          break;
        case "scheduled_date":
          av = a.scheduled_date ?? "";
          bv = b.scheduled_date ?? "";
          break;
        case "views":
          av = a.views ?? 0;
          bv = b.views ?? 0;
          break;
        case "saves":
          av = a.saves ?? 0;
          bv = b.saves ?? 0;
          break;
      }

      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

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
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (!userId || selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} post(s)?`)) return;
    const insforge = getInsforge();
    const ids = Array.from(selected);
    await insforge.database
      .from("posts")
      .delete()
      .in("id", ids)
      .eq("user_id", userId);
    setSelected(new Set());
    fetchData();
  };

  const handleBulkStatus = async (status: PostStatus) => {
    if (!userId || selected.size === 0) return;
    const insforge = getInsforge();
    const ids = Array.from(selected);
    await insforge.database
      .from("posts")
      .update({ status, updated_at: new Date().toISOString() })
      .in("id", ids)
      .eq("user_id", userId);
    setSelected(new Set());
    fetchData();
  };

  // New post
  const handleNewPost = async () => {
    if (!userId) return;
    const insforge = getInsforge();
    const { data, error } = await insforge.database
      .from("posts")
      .insert({
        user_id: userId,
        title: "Untitled",
        pillar: "hot-take",
        platform: "instagram",
        status: "idea",
      })
      .select()
      .single();

    if (!error && data) {
      await fetchData();
      setEditorPost(data as Post);
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

  const handleEditorSave = () => {
    fetchData();
  };

  const handleEditorDelete = () => {
    closeEditor();
    fetchData();
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-surface rounded animate-pulse" />
          <div className="h-9 w-28 bg-surface rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-surface rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          Library
        </h1>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-bg border border-border rounded pl-8 pr-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-coral w-44 sm:w-56"
            />
          </div>
          {/* View toggle */}
          <button
            onClick={() => setView("card")}
            className={`p-2 rounded border ${
              view === "card"
                ? "border-coral text-coral"
                : "border-border text-text-muted hover:text-text-primary"
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("table")}
            className={`p-2 rounded border ${
              view === "table"
                ? "border-coral text-coral"
                : "border-border text-text-muted hover:text-text-primary"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          {/* New Post */}
          <button
            onClick={handleNewPost}
            className="flex items-center gap-1.5 bg-coral text-white text-sm font-medium px-3 py-1.5 rounded hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Post
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2">
        <FilterDropdown
          label="Pillar"
          value={pillarFilter}
          onChange={(v) => setPillarFilter(v as Pillar | "all")}
          options={[
            { value: "all", label: "All" },
            ...ALL_PILLARS.map((p) => ({ value: p, label: PILLAR_LABELS[p] })),
          ]}
        />
        <FilterDropdown
          label="Platform"
          value={platformFilter}
          onChange={(v) => setPlatformFilter(v as Platform | "all")}
          options={[
            { value: "all", label: "All" },
            ...ALL_PLATFORMS.map((p) => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) })),
          ]}
        />
        <FilterDropdown
          label="Status"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as PostStatus | "all")}
          options={[
            { value: "all", label: "All" },
            ...ALL_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
          ]}
        />
        {series.length > 0 && (
          <FilterDropdown
            label="Series"
            value={seriesFilter}
            onChange={(v) => setSeriesFilter(v)}
            options={[
              { value: "all", label: "All" },
              ...series.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-2">
          <span className="text-sm text-text-muted">
            {selected.size} selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
          <div className="relative group">
            <button className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary">
              Change Status
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 hidden group-hover:block z-20">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleBulkStatus(s)}
                  className="block w-full text-left px-4 py-1.5 text-sm text-text-primary hover:bg-bg capitalize"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-text-muted text-lg mb-4">
            {posts.length === 0
              ? "No posts yet. Create your first one!"
              : "No posts match your filters."}
          </p>
          {posts.length === 0 && (
            <button
              onClick={handleNewPost}
              className="flex items-center gap-1.5 bg-coral text-white text-sm font-medium px-4 py-2 rounded hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              New Post
            </button>
          )}
        </div>
      ) : view === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((post) => (
            <div
              key={post.id}
              className="bg-surface border border-border rounded-lg p-4 cursor-pointer hover:border-text-muted transition-colors relative"
              onClick={() => openEditor(post)}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selected.has(post.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleSelect(post.id);
                }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-3 right-3 w-4 h-4 accent-coral"
              />
              <div className="flex items-center gap-2 mb-2">
                <PillarDot pillar={post.pillar} />
                <h3 className="font-medium text-text-primary text-sm truncate pr-6">
                  {post.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] text-text-muted bg-bg border border-border rounded px-1.5 py-0.5 capitalize">
                  {post.platform}
                </span>
                <StatusBadge status={post.status} />
              </div>
              {post.script && (
                <p className="text-xs text-text-muted leading-relaxed mb-3 line-clamp-3">
                  {post.script.slice(0, 120)}
                  {post.script.length > 120 ? "..." : ""}
                </p>
              )}
              <div className="flex items-center justify-between text-[11px] text-text-muted">
                <span>{formatDate(post.scheduled_date)}</span>
                {(post.views !== null || post.saves !== null) && (
                  <span className="flex gap-2">
                    {post.views !== null && <span>{post.views} views</span>}
                    {post.saves !== null && <span>{post.saves} saves</span>}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted text-left">
                <th className="py-2 px-2 w-8">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-coral"
                  />
                </th>
                {(
                  [
                    ["title", "Title"],
                    ["pillar", "Pillar"],
                    ["platform", "Platform"],
                    ["status", "Status"],
                    ["scheduled_date", "Scheduled"],
                    ["views", "Views"],
                    ["saves", "Saves"],
                  ] as [SortKey, string][]
                ).map(([key, label]) => (
                  <th
                    key={key}
                    className="py-2 px-2 font-medium cursor-pointer hover:text-text-primary select-none"
                    onClick={() => toggleSort(key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-border hover:bg-bg/50 cursor-pointer transition-colors"
                  onClick={() => openEditor(post)}
                >
                  <td className="py-2.5 px-2">
                    <input
                      type="checkbox"
                      checked={selected.has(post.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelect(post.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 accent-coral"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-text-primary font-medium max-w-[200px] truncate">
                    {post.title}
                  </td>
                  <td className="py-2.5 px-2">
                    <PillarDot pillar={post.pillar} showLabel />
                  </td>
                  <td className="py-2.5 px-2 text-text-muted capitalize">
                    {post.platform}
                  </td>
                  <td className="py-2.5 px-2">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="py-2.5 px-2 text-text-muted">
                    {formatDate(post.scheduled_date)}
                  </td>
                  <td className="py-2.5 px-2 text-text-muted">
                    {post.views ?? "-"}
                  </td>
                  <td className="py-2.5 px-2 text-text-muted">
                    {post.saves ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Post Editor Drawer */}
      {editorOpen && editorPost && userId && (
        <PostEditor
          post={editorPost}
          userId={userId}
          series={series}
          onClose={closeEditor}
          onSave={handleEditorSave}
          onDelete={handleEditorDelete}
        />
      )}
    </div>
  );
}

/* ---- Filter Dropdown ---- */

interface FilterOption {
  value: string;
  label: string;
}

function FilterDropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-bg border border-border rounded pl-3 pr-7 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-coral cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {label}: {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
    </div>
  );
}
