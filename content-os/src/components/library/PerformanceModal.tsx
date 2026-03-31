'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Post } from '@/lib/types';

interface PerformanceModalProps {
  post: Post;
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
}

export default function PerformanceModal({ post, onSave, onClose }: PerformanceModalProps) {
  const [postedDate, setPostedDate] = useState(post.posted_date ?? new Date().toISOString().slice(0, 10));
  const [views, setViews] = useState(post.views ?? 0);
  const [likes, setLikes] = useState(post.likes ?? 0);
  const [saves, setSaves] = useState(post.saves ?? 0);
  const [comments, setComments] = useState(post.comments ?? 0);
  const [shares, setShares] = useState(post.shares ?? 0);
  const [followsGained, setFollowsGained] = useState(post.follows_gained ?? 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      posted_date: postedDate,
      views,
      likes,
      saves,
      comments,
      shares,
      follows_gained: followsGained,
      status: 'posted',
      updated_at: new Date().toISOString(),
    });
  }

  const inputClass = "w-full bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-3 py-1.5 text-[13px] text-[#FAFAFA] focus:outline-none focus:border-[#FAFAFA]/40 transition-colors";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40">
      <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-[18px] font-[700] text-[#FAFAFA]">Log Performance</h3>
          <button onClick={onClose} className="text-[#71717A] hover:text-[#FAFAFA] transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Posted Date">
            <input
              type="date"
              value={postedDate}
              onChange={(e) => setPostedDate(e.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Views" value={views} onChange={setViews} />
            <NumberField label="Likes" value={likes} onChange={setLikes} />
            <NumberField label="Saves" value={saves} onChange={setSaves} />
            <NumberField label="Comments" value={comments} onChange={setComments} />
            <NumberField label="Shares" value={shares} onChange={setShares} />
            <NumberField label="Follows Gained" value={followsGained} onChange={setFollowsGained} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-[14px] py-[7px] text-[13px] text-[#71717A] hover:text-[#FAFAFA] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-[10px] text-[13px] bg-[#6366F1] text-white rounded-[7px] hover:opacity-90 transition-opacity font-medium"
            >
              Save Performance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] text-[#71717A] mb-1 block font-medium tracking-[0.05em]">{label}</span>
      {children}
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <Field label={label}>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-3 py-1.5 text-[13px] text-[#FAFAFA] focus:outline-none focus:border-[#FAFAFA]/40 transition-colors"
      />
    </Field>
  );
}
