'use client';

import type { Post } from '@/lib/types';
import PostCard from '@/components/library/PostCard';

interface PostGridProps {
  posts: Post[];
  selected: Set<string>;
  onSelect: (id: string) => void;
  onClickPost: (post: Post) => void;
}

export default function PostGrid({ posts, selected, onSelect, onClickPost }: PostGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px]">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          selected={selected.has(post.id)}
          onSelect={onSelect}
          onClick={onClickPost}
        />
      ))}
    </div>
  );
}
