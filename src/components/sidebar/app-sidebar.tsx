"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  Plus,
  Bot,
  Store,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AgentAvatar } from "@/components/ui/agent-avatar";
import { QUOTA_LIMITS } from "@/lib/quota-config";

export interface AgentItem {
  id: string;
  name: string;
  avatarSeed: string;
  isActive: boolean;
}

export interface UsageData {
  tokensUsed: number;
  runsUsed: number;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch agents list
  const { data: agents = [], isLoading: loadingAgents } = useQuery<AgentItem[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/agents");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch usage stats
  const { data: usage = { tokensUsed: 0, runsUsed: 0 } } = useQuery<UsageData>({
    queryKey: ["usage"],
    queryFn: async () => {
      const res = await fetch("/api/usage");
      if (!res.ok) return { tokensUsed: 0, runsUsed: 0 };
      return res.json();
    },
  });

  const chatUsagePct = Math.min(
    100,
    Math.round((usage.tokensUsed / QUOTA_LIMITS.MONTHLY_CHAT_MESSAGES) * 100)
  );

  const runUsagePct = Math.min(
    100,
    Math.round((usage.runsUsed / QUOTA_LIMITS.MONTHLY_ROUTINE_RUNS) * 100)
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-72 shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1">
              Orbit
              <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-1.5 py-0.5 rounded-full border border-blue-100">
                PRO
              </span>
            </span>
            <p className="text-[11px] text-slate-400 font-medium">AI Autonomous Agent Platform</p>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Action */}
      <div className="p-4 pb-2">
        <Link
          href="/agents/new"
          onClick={() => setMobileOpen(false)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Agent</span>
        </Link>
      </div>

      {/* Agents List & Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        <div>
          <div className="px-3 mb-2 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Your Agents</span>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-md font-mono">
              {agents.length}
            </span>
          </div>

          {loadingAgents ? (
            <div className="space-y-1.5 px-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-100/70 animate-pulse h-11"
                />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="px-3 py-6 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Bot className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs text-slate-500 font-medium">No agents created yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click create above to get started</p>
            </div>
          ) : (
            <nav className="space-y-1">
              {agents.map((agent: AgentItem) => {
                const isActive = pathname === `/agents/${agent.id}`;
                return (
                  <Link
                    key={agent.id}
                    href={`/agents/${agent.id}`}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                      isActive
                        ? "bg-blue-50 text-blue-700 shadow-xs border border-blue-100/80 font-semibold"
                        : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
                    }`}
                  >
                    <AgentAvatar
                      seed={agent.avatarSeed}
                      name={agent.name}
                      size="sm"
                      showOnline={agent.isActive}
                    />
                    <span className="truncate flex-1">{agent.name}</span>
                    {!agent.isActive && (
                      <span className="text-[10px] bg-slate-200/80 text-slate-500 px-1.5 py-0.5 rounded-md font-normal">
                        Paused
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Explore
          </div>
          <nav className="space-y-1">
            <Link
              href="/marketplace"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                pathname === "/marketplace"
                  ? "bg-blue-50 text-blue-700 shadow-xs border border-blue-100/80 font-semibold"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                <Store className="w-4 h-4" />
              </div>
              <span className="flex-1">Marketplace</span>
              <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-200/60 font-semibold">
                Soon
              </span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Footer / User Profile & Usage Quota */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 space-y-3">
        {/* Quota Progress */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-700">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Monthly Quota
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {usage.tokensUsed}/{QUOTA_LIMITS.MONTHLY_CHAT_MESSAGES} msg
            </span>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  chatUsagePct > 90 ? "bg-red-500" : "bg-blue-600"
                }`}
                style={{ width: `${chatUsagePct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{usage.runsUsed}/{QUOTA_LIMITS.MONTHLY_ROUTINE_RUNS} runs</span>
              <span>{Math.max(chatUsagePct, runUsagePct)}% used</span>
            </div>
          </div>
        </div>

        {/* User Button Row */}
        <div className="flex items-center justify-between px-1 py-0.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-lg shadow-xs",
                },
              }}
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {user?.fullName || user?.username || "User"}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
          aria-label="Open menu"
        >
          <X className="w-6 h-6" />
        </button>
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Bot className="w-4 h-4" />
          </div>
          <span>Orbit</span>
        </Link>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>

      {/* Desktop Permanent Sidebar */}
      <aside className="hidden md:flex h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 max-w-xs w-full bg-white z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
