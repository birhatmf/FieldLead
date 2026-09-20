"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/search", label: "Araştırma", icon: Search },
  { href: "/leads", label: "Leadler", icon: Users },
  { href: "/settings", label: "Ayarlar", icon: Settings },
] as const;

interface MainNavProps {
  orientation?: "vertical" | "horizontal";
}

export function MainNav({ orientation = "vertical" }: MainNavProps) {
  const pathname = usePathname();
  const isVertical = orientation === "vertical";

  return (
    <nav
      aria-label="Ana menü"
      className={cn(
        "flex",
        isVertical
          ? "flex-col gap-1 p-3"
          : "items-center justify-between gap-1 px-2 py-2",
      )}
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center rounded-lg font-medium transition-colors duration-200 cursor-pointer",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
              isVertical
                ? "gap-3 px-3 py-2 text-sm"
                : "flex-1 justify-center gap-1.5 px-2 py-2 text-xs",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
