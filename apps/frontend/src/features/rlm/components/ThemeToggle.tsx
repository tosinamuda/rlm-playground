"use client";

import { useTheme } from "../providers/ThemeProvider";
import { Sun, Moon, Monitor, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

/**
 * A toggle button to switch between light, dark, and system themes.
 *
 * Displays the current theme state and cycles through options on click.
 *
 * @returns The rendered theme toggle button
 */
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return a placeholder during SSR/hydration to avoid mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-400 w-[76px] h-[30px]">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return <ThemeToggleInner />;
}

function ThemeToggleInner() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    const next =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
  };

  const Icon =
    theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;
  const label =
    theme === "system" ? "System" : resolvedTheme === "dark" ? "Dark" : "Light";

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
        "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700",
        "text-zinc-600 dark:text-zinc-300"
      )}
      title={`Current: ${label}. Click to cycle.`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
