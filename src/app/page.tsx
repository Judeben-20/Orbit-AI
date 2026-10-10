"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Bot, Plus, ArrowRight, Clock, MessageSquare, AlertCircle } from "lucide-react";
import { AgentAvatar } from "@/components/ui/agent-avatar";
import { Button } from "@/components/ui/button";

interface AgentItem {
  id: string;
  name: string;
  avatarSeed: string;
  instructions?: string;
  isActive: boolean;
  createdAt: string;
}

export default function Home() {
  const { data: agents = [], isLoading, isError } = useQuery<AgentItem[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
  });

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              My Agents
              <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-0.5 rounded-full border border-blue-100">
                {agents.length} Total
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your autonomous AI assistants, schedules, and connected tools.
            </p>
          </div>
          <Link href="/agents/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-xs gap-2">
              <Plus className="w-4 h-4" />
              Create New Agent
            </Button>
          </Link>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 rounded-2xl bg-slate-100 animate-pulse border border-slate-200"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-600 text-sm font-medium">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
            Failed to load agents. Please refresh the page.
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">No agents yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1">
                Create your first AI agent to start automating tasks, scheduling routines, and connecting tools.
              </p>
            </div>
            <Link href="/agents/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-xs">
                Get Started
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <AgentAvatar seed={agent.avatarSeed} size="md" showOnline={agent.isActive} />
                      <div>
                        <h2 className="font-semibold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                          {agent.name}
                        </h2>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-0.5 ${
                            agent.isActive
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${agent.isActive ? "bg-green-500" : "bg-slate-400"}`} />
                          {agent.isActive ? "Active" : "Paused"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4 min-h-[3rem]">
                    {agent.instructions || "No custom instructions provided."}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </span>
                  <Link href={`/agents/${agent.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-blue-200 text-blue-600 hover:bg-blue-50 font-medium h-8 px-3 gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat &amp; Config
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
