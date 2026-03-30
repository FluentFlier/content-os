'use client';

import { ArrowUpDown } from 'lucide-react';
import type { Post } from '@/lib/types';
import type { Status } from '@/lib/constants';
import { STATUSES } from '@/lib/constants';
import StatusBadge from '@/components/ui/StatusBadge';
import PillarBadge from '@/components/ui/PillarBadge';
import { formatDateShort } from '@/lib/utils';
import { useMemo, useState } from 'react';

type SortKey = 'title' | 'pillar' | 'platform' | 'status' | 'scheduled_date' | 'views';
type SortDir = 'asc' | 'desc';

interface PostTableProps {
  posts: Post[];
  selected: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onClickPost: (post: Post) => void;
}

const COLUMNS: [SortKey, string][] = [
  ['title', 'Title'],
  ['pillar', 'Pillar'],
  ['platform', 'Platform'],
  ['status', 'Status'],
  ['scheduled_date', 'Scheduled'],
  ['views', 'Performance'],
];

export default function PostTable({ posts, selected, onSelect, onSelectAll, onClickPost }: PostTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('scheduled_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    const arr = [...posts];
    arr.sort((a, b) => {
      let av: string | number | null = null;
      let bv: string | number | null = null;

      switch (sortKey) {
        case 'title': av = a.title.toLowerCase(); bv = b.title.toLowerCase(); break;
        case 'pillar': av = a.pillar; bv = b.pillar; break;
        case 'platform': av = a.platform; bv = b.platform; break;
        case 'status': av = STATUSES.indexOf(a.status); bv = STATUSES.indexOf(b.status); break;
        case 'scheduled_date': av = a.scheduled_date ?? ''; bv = b.scheduled_date ?? ''; break;
        case 'views': av = a.views ?? 0; bv = b.views ?? 0; break;
      }

      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [posts, sortKey, sortDir]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b-[0.5px] border-[#1A1714]/12 text-[#8C857D] text-left">
            <th className="py-2 px-2 w-8">
              <input
                type="checkbox"
                checked={selected.size === posts.length && posts.length > 0}
                onChange={onSelectAll}
                className="w-4 h-4 accent-[#EB5E55]"
              />
            </th>
            {COLUMNS.map(([key, label]) => (
              <th
                key={key}
                className="py-2 px-2 font-medium cursor-pointer hover:text-[#1A1714] select-none text-[13px]"
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
              className="border-b-[0.5px] border-[#1A1714]/12 hover:bg-[#EDECEA] cursor-pointer transition-colors"
              onClick={() => onClickPost(post)}
            >
              <td className="py-2.5 px-2">
                <input
                  type="checkbox"
                  checked={selected.has(post.id)}
                  onChange={(e) => { e.stopPropagation(); onSelect(post.id); }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 accent-[#EB5E55]"
                />
              </td>
              <td className="py-2.5 px-2 text-[#1A1714] font-medium max-w-[200px] truncate">
                {post.title}
              </td>
              <td className="py-2.5 px-2">
                <PillarBadge pillar={post.pillar} />
              </td>
              <td className="py-2.5 px-2 text-[#8C857D] capitalize">{post.platform}</td>
              <td className="py-2.5 px-2">
                <StatusBadge status={post.status} />
              </td>
              <td className="py-2.5 px-2 text-[#8C857D]">{formatDateShort(post.scheduled_date)}</td>
              <td className="py-2.5 px-2 text-[#8C857D]">
                {post.views !== null ? `${post.views} views` : '--'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
