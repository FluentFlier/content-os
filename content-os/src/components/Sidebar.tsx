"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wand2,
  Grid3X3,
  Calendar,
  Archive,
  Lightbulb,
  Layers,
  BarChart3,
  Settings,
  Zap,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Generate", href: "/generate", icon: Wand2 },
  { name: "Library", href: "/library", icon: Grid3X3 },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Story Bank", href: "/story-bank", icon: Archive },
  { name: "Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Series", href: "/series", icon: Layers },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col fixed left-0 top-0 bottom-0 w-60 bg-surface border-r border-border z-40">
      <div className="px-5 pt-6 pb-2">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber/10 flex items-center justify-center">
            <Zap size={14} className="text-amber" />
          </div>
          <h1 className="font-display font-normal text-lg text-text-primary italic tracking-tight">
            Content OS
          </h1>
        </Link>
      </div>

      <div className="mx-4 my-3 border-t border-border" />

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "text-amber border-l-2 border-amber bg-amber/5"
                  : "text-text-muted hover:text-text-primary hover:bg-white/[0.03]"
              }`}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
