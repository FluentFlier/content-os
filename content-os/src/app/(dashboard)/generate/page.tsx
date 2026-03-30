"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs } from "@/components/ui/Tabs";
import { SkeletonLines } from "@/components/ui/Skeleton";
import { ScriptGenerator } from "@/components/generate/ScriptGenerator";
import { StoryMine } from "@/components/generate/StoryMine";
import { CaptionHashtags } from "@/components/generate/CaptionHashtags";
import { HookGenerator } from "@/components/generate/HookGenerator";
import { Repurpose } from "@/components/generate/Repurpose";
import { TrendCatcher } from "@/components/generate/TrendCatcher";
import { CommentReplies } from "@/components/generate/CommentReplies";
import { SeriesPlanner } from "@/components/generate/SeriesPlanner";

type TabId =
  | "script"
  | "story-mine"
  | "caption"
  | "hooks"
  | "repurpose"
  | "trend"
  | "comments"
  | "series";

const TAB_LIST: { id: TabId; label: string }[] = [
  { id: "script", label: "Script" },
  { id: "story-mine", label: "Story Mine" },
  { id: "caption", label: "Caption + Tags" },
  { id: "hooks", label: "Hooks" },
  { id: "repurpose", label: "Repurpose" },
  { id: "trend", label: "Trend" },
  { id: "comments", label: "Replies" },
  { id: "series", label: "Series" },
];

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <h1 className="font-['Syne'] font-[800] text-[21px] text-[#1A1714] tracking-[-0.02em] leading-[1.2]">
            Generate
          </h1>
          <div className="bg-[#FAFAF8] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[12px] p-[13px_14px]">
            <SkeletonLines count={3} />
          </div>
        </div>
      }
    >
      <GeneratePageInner />
    </Suspense>
  );
}

function GeneratePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabBarRef = useRef<HTMLDivElement>(null);

  const tabParam = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    TAB_LIST.find((t) => t.id === tabParam)?.id || "script",
  );

  // Sync URL with active tab
  useEffect(() => {
    const current = searchParams.get("tab");
    if (current !== activeTab) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", activeTab);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [activeTab, searchParams, router]);

  // Scroll active tab into view
  useEffect(() => {
    if (!tabBarRef.current) return;
    const activeEl = tabBarRef.current.querySelector(
      `[data-tab="${activeTab}"]`,
    );
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeTab]);

  // Read pre-fill params for the Ideas "Convert to Script" flow
  const initialResult = searchParams.get("result") || "";
  const initialTopic = searchParams.get("topic") || "";
  const initialPillar = searchParams.get("pillar") || "";

  const renderTab = () => {
    switch (activeTab) {
      case "script":
        return (
          <ScriptGenerator
            initialResult={initialResult}
            initialTopic={initialTopic}
            initialPillar={initialPillar}
          />
        );
      case "story-mine":
        return <StoryMine />;
      case "caption":
        return <CaptionHashtags />;
      case "hooks":
        return <HookGenerator />;
      case "repurpose":
        return <Repurpose />;
      case "trend":
        return <TrendCatcher />;
      case "comments":
        return <CommentReplies />;
      case "series":
        return <SeriesPlanner />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-['Syne'] font-[800] text-[21px] text-[#1A1714] tracking-[-0.02em] leading-[1.2]">Generate</h1>

      {/* Tab bar */}
      <div ref={tabBarRef} className="-mx-4 px-4 md:mx-0 md:px-0">
        <Tabs
          tabs={TAB_LIST}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />
      </div>

      {/* Tab content */}
      <div className="bg-[#FAFAF8] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[12px] p-[13px_14px]">
        {renderTab()}
      </div>
    </div>
  );
}
