"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Bot, Plus, Sparkles, ArrowRight, Zap, Clock } from "lucide-react";
import { AgentItem } from "@/components/sidebar/app-sidebar";

export default function AppHomePage() {
  const router = useRouter();

  const { data: agents = [], isLoading } = useQuery<AgentItem[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/agents");
      if (!res.ok) return [];
      return res.json();
    },
  });

  useEffect(() => {
    if (!isLoading && agents.length > 0) {
      router.push(`/agents/${agents[0].id}`);
    }
  }, [agents, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white animate-bounce">
            <Bot className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-500">Loading your agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 max-w-4xl mx-auto">
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Welcome to Orbit
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Build & Orchestrate Autonomous AI Agents
        </h1>
        <p className="text-slate-600 max-w-lg mx-auto text-sm md:text-base">
          Create customized AI bots that remember your instructions, chat in real-time, connect to Gmail and Slack, and automate background routines on a schedule.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-10">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">Contextual Memory</h3>
          <p className="text-xs text-slate-500">
            Agents retain custom instructions and conversation context for intelligent responses.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">Tool Integration</h3>
          <p className="text-xs text-slate-500">
            Connect to Gmail and Slack via Composio to automate your actual tools safely.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">Scheduled Routines</h3>
          <p className="text-xs text-slate-500">
            Run automated cron tasks in the background with Inngest and view run histories.
          </p>
        </div>
      </div>

      <Link
        href="/agents/new"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <Plus className="w-5 h-5" />
        Create Your First Agent
        <ArrowRight className="w-4 h-4 ml-1" />
      </Link>
    </div>
  );
}
