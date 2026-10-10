"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

const PALETTES = [
  { bg: "bg-blue-500", eyes: "bg-white" },
  { bg: "bg-purple-500", eyes: "bg-white" },
  { bg: "bg-emerald-500", eyes: "bg-white" },
  { bg: "bg-amber-500", eyes: "bg-slate-900" },
  { bg: "bg-rose-500", eyes: "bg-white" },
  { bg: "bg-indigo-500", eyes: "bg-white" },
  { bg: "bg-cyan-500", eyes: "bg-slate-900" },
  { bg: "bg-teal-500", eyes: "bg-white" },
  { bg: "bg-violet-500", eyes: "bg-white" },
  { bg: "bg-pink-500", eyes: "bg-white" },
];

export function getAvatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index];
}

interface AgentAvatarProps {
  seed?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showOnline?: boolean;
  className?: string;
}

export function AgentAvatar({
  seed = "default",
  name = "Agent",
  size = "md",
  showOnline = true,
  className,
}: AgentAvatarProps) {
  const palette = useMemo(() => getAvatarColor(seed), [seed]);

  const sizeClasses = {
    sm: "w-8 h-8 rounded-lg text-xs",
    md: "w-10 h-10 rounded-xl text-sm",
    lg: "w-12 h-12 rounded-xl text-base",
    xl: "w-16 h-16 rounded-2xl text-lg",
  }[size];

  const eyeSizeClasses = {
    sm: "w-1 h-1 gap-1",
    md: "w-1.5 h-1.5 gap-1.5",
    lg: "w-2 h-2 gap-2",
    xl: "w-2.5 h-2.5 gap-2.5",
  }[size];

  const onlineBadgeSize = {
    sm: "w-2 h-2 -bottom-0.5 -right-0.5 border",
    md: "w-2.5 h-2.5 -bottom-0.5 -right-0.5 border-2",
    lg: "w-3 h-3 bottom-0 right-0 border-2",
    xl: "w-3.5 h-3.5 bottom-0.5 right-0.5 border-2",
  }[size];

  return (
    <div className="relative inline-block shrink-0">
      <div
        className={cn(
          "flex items-center justify-center font-bold text-white shadow-sm transition-all duration-200 select-none",
          palette.bg,
          sizeClasses,
          className
        )}
        title={name}
      >
        <div className={cn("flex items-center justify-center", eyeSizeClasses)}>
          <span className={cn("rounded-full shadow-inner", palette.eyes)} />
          <span className={cn("rounded-full shadow-inner", palette.eyes)} />
        </div>
      </div>
      {showOnline && (
        <span
          className={cn(
            "absolute rounded-full bg-emerald-500 border-white shadow-xs",
            onlineBadgeSize
          )}
          title="Online"
        />
      )}
    </div>
  );
}
