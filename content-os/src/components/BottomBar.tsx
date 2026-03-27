"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wand2,
  Grid3X3,
  Calendar,
  Settings,
} from "lucide-react";

const bottomItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Generate", href: "/generate", icon: Wand2 },
  { name: "Library", href: "/library", icon: Grid3X3 },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function BottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-surface border-t border-border z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {bottomItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors ${
                isActive ? "text-coral" : "text-text-muted"
              }`}
            >
              <Icon size={20} strokeWidth={1.8} />
              <span className="text-[10px] leading-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
