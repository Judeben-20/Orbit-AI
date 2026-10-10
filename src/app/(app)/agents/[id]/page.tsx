"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AgentAvatar } from "@/components/ui/agent-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Shuffle,
  Settings,
  Trash,
  AlertTriangle,
  Monitor,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Plug,
  UserX,
} from "lucide-react";
import { ChatInterface } from "@/components/chat/chat-interface";

interface ConnectionRecord {
  id: string;
  appSlug: string;
  status: string;
}

interface RoutineRecord {
  id: string;
  title: string;
  prompt: string;
  cron: string;
  timezone: string;
  status: string;
  nextRunAt?: string;
}

interface RunRecord {
  id: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  output?: string;
  error?: string;
  routine?: {
    title: string;
  };
}

export default function AgentConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [instructions, setInstructions] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("");
  const [isActive, setIsActive] = useState(true);

  const resolvedParams = React.use(params);
  const agentId = resolvedParams.id;

  // Fetch Agent data
  const { data: agent, isLoading: loadingAgent } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: async () => {
      const res = await fetch(`/api/agents/${agentId}`);
      if (!res.ok) throw new Error("Agent not found");
      return res.json();
    },
  });

  // Fetch Connections data
  const { data: connections = [], isLoading: loadingConnections } = useQuery<ConnectionRecord[]>({
    queryKey: ["connections"],
    queryFn: async () => {
      const res = await fetch("/api/connections");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Routines data
  const { data: routines = [], isLoading: loadingRoutines } = useQuery<RoutineRecord[]>({
    queryKey: ["routines", agentId],
    queryFn: async () => {
      const res = await fetch(`/api/routines?agentId=${agentId}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch History (Routine Runs) data
  const { data: runs = [], isLoading: loadingRuns, refetch: refetchRuns } = useQuery<RunRecord[]>({
    queryKey: ["runs", agentId],
    queryFn: async () => {
      const res = await fetch(`/api/agents/${agentId}/runs`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  useEffect(() => {
    if (agent) {
      setInstructions(agent.instructions || "");
      setAvatarSeed(agent.avatarSeed);
      setIsActive(agent.isActive);
    }
  }, [agent]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update agent");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete agent");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      router.push("/");
    },
  });

  const runNowMutation = useMutation({
    mutationFn: async (routineId: string) => {
      const res = await fetch(`/api/routines/${routineId}/run`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to run routine");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["runs", agentId] });
      setActiveTab("history");
    },
  });

  const toggleRoutineMutation = useMutation({
    mutationFn: async ({ routineId, currentStatus }: { routineId: string; currentStatus: string }) => {
      const newStatus = currentStatus === "active" ? "paused" : "active";
      const res = await fetch(`/api/routines/${routineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update routine");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines", agentId] });
    },
  });

  const deleteRoutineMutation = useMutation({
    mutationFn: async (routineId: string) => {
      const res = await fetch(`/api/routines/${routineId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete routine");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines", agentId] });
    },
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ runId, decision }: { runId: string; decision: "approve" | "reject" }) => {
      const res = await fetch(`/api/runs/${runId}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) throw new Error("Failed to process approval");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["runs", agentId] });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (connId: string) => {
      const res = await fetch(`/api/connections/${connId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect tool");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
    },
    onSuccess: () => {
      router.push("/");
      window.location.reload();
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ instructions, avatarSeed, isActive });
  };

  const handleShuffle = () => {
    setAvatarSeed(Math.random().toString(36).substring(7));
  };

  if (loadingAgent) return <div className="p-8 text-sm text-slate-500 animate-pulse">Loading agent...</div>;
  if (!agent) return <div className="p-8 text-sm text-slate-500">Agent not found</div>;

  return (
    <div className="flex h-full flex-col md:flex-row bg-white">
      {/* Center: Chat Interface */}
      <div className="flex-1 flex flex-col border-r min-w-0">
        <div className="border-b p-4 flex items-center justify-between shadow-xs bg-white">
          <div className="flex items-center gap-3">
            <AgentAvatar seed={avatarSeed} size="sm" showOnline={isActive} />
            <h2 className="font-semibold text-slate-900">{agent.name}</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-slate-300"}`} />
            {isActive ? "Active" : "Paused"}
          </div>
        </div>
        <ChatInterface
          agentId={agent.id}
          agentName={agent.name}
          avatarSeed={avatarSeed}
          isActive={isActive}
        />
      </div>

      {/* Right Panel: Agent Configuration */}
      <div className="w-full md:w-80 bg-slate-50 flex flex-col h-full overflow-y-auto shrink-0 border-l border-slate-200">
        <div className="p-4 border-b bg-white flex justify-between items-center sticky top-0 z-10">
          <h3 className="font-semibold text-slate-800 text-sm">Agent Configuration</h3>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 h-7 text-xs font-medium px-3"
          >
            Save
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border-b px-2 overflow-x-auto text-xs font-medium">
          <button
            className={`px-3 py-2.5 border-b-2 transition-colors ${
              activeTab === "general"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("general")}
          >
            General
          </button>
          <button
            className={`px-3 py-2.5 border-b-2 transition-colors ${
              activeTab === "tools"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("tools")}
          >
            Tools
          </button>
          <button
            className={`px-3 py-2.5 border-b-2 transition-colors ${
              activeTab === "schedule"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("schedule")}
          >
            Schedule
          </button>
          <button
            className={`px-3 py-2.5 border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("history")}
          >
            History
          </button>
          <button
            className={`px-3 py-2.5 border-b-2 transition-colors ${
              activeTab === "management"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("management")}
            aria-label="Management Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex-1">
          {/* TAB 1: GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <AgentAvatar seed={avatarSeed} size="lg" />
                <Button variant="outline" size="sm" onClick={handleShuffle} className="mt-3 h-7 text-xs">
                  <Shuffle className="w-3 h-3 mr-1.5" /> Shuffle Avatar
                </Button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-slate-500" /> VM Desktop
                  </h4>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                    Inactive
                  </span>
                </div>
                <div className="h-24 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700">
                  <span className="text-slate-400 text-xs font-mono">Terminal Offline</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Description & Instructions</label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  maxLength={2000}
                  className="resize-none h-36 text-xs bg-white border-slate-200 shadow-2xs"
                  placeholder="Describe your agent's role, persona, and capabilities..."
                />
                <div className="text-right text-[11px] text-slate-400 font-mono">
                  {instructions.length}/2000
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TOOLS */}
          {activeTab === "tools" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <h4 className="text-xs font-semibold text-slate-800 mb-3">Connect New Tool</h4>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8"
                    onClick={async () => {
                      const res = await fetch("/api/connections", {
                        method: "POST",
                        body: JSON.stringify({ appSlug: "gmail" }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        if (data.url) window.open(data.url, "_blank");
                      }
                    }}
                  >
                    Connect Gmail
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8"
                    onClick={async () => {
                      const res = await fetch("/api/connections", {
                        method: "POST",
                        body: JSON.stringify({ appSlug: "slack" }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        if (data.url) window.open(data.url, "_blank");
                      }
                    }}
                  >
                    Connect Slack
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                <h4 className="text-xs font-semibold text-slate-800 mb-1">Your Connected Tools</h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  Connected tools allow your agents to perform actions on your behalf.
                </p>

                {loadingConnections ? (
                  <div className="text-xs text-slate-400 py-4 text-center">Loading connections...</div>
                ) : connections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-center">
                    <Plug className="w-5 h-5 mb-1.5 text-slate-300" />
                    <p className="text-xs font-medium text-slate-500">No connected tools yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {connections.map((conn) => (
                      <div
                        key={conn.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 capitalize">{conn.appSlug}</span>
                          <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded font-medium">
                            Connected
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => disconnectMutation.mutate(conn.id)}
                          disabled={disconnectMutation.isPending}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SCHEDULE */}
          {activeTab === "schedule" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-semibold text-slate-800">Active Routines</h4>
                <span className="text-[11px] text-slate-400">{routines.length} total</span>
              </div>

              {loadingRoutines ? (
                <div className="text-xs text-slate-400 py-4 text-center">Loading routines...</div>
              ) : routines.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-white border border-dashed border-slate-200 rounded-xl text-slate-400 text-center">
                  <Clock className="w-6 h-6 mb-2 text-slate-300" />
                  <p className="text-xs font-medium text-slate-500">No routines yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ask your agent in chat to schedule a task!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {routines.map((routine) => (
                    <div
                      key={routine.id}
                      className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">{routine.title}</h5>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{routine.prompt}</p>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                            routine.status === "active"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {routine.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                        <div>Cron: {routine.cron} ({routine.timezone})</div>
                        {routine.nextRunAt && (
                          <div>Next: {new Date(routine.nextRunAt).toLocaleString()}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 font-medium"
                          onClick={() => runNowMutation.mutate(routine.id)}
                          disabled={runNowMutation.isPending}
                        >
                          <Play className="w-3 h-3 mr-1" /> Run Now
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-slate-600 hover:bg-slate-100"
                          onClick={() =>
                            toggleRoutineMutation.mutate({
                              routineId: routine.id,
                              currentStatus: routine.status,
                            })
                          }
                        >
                          {routine.status === "active" ? "Pause" : "Resume"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-red-600 hover:bg-red-50"
                          onClick={() => deleteRoutineMutation.mutate(routine.id)}
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-800">Execution Runs</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[11px] text-slate-500 hover:text-slate-800"
                  onClick={() => refetchRuns()}
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                </Button>
              </div>

              {loadingRuns ? (
                <div className="text-xs text-slate-400 py-4 text-center">Loading execution history...</div>
              ) : runs.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-white border border-dashed border-slate-200 rounded-xl text-slate-400 text-center">
                  <p className="text-xs font-medium text-slate-500">No executions yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {runs.map((run) => (
                    <div
                      key={run.id}
                      className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
                          {run.routine?.title || "Scheduled Routine"}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border flex items-center gap-1 ${
                            run.status === "success"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : run.status === "failed"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : run.status === "needs_approval"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {run.status === "success" && <CheckCircle2 className="w-3 h-3" />}
                          {run.status === "failed" && <XCircle className="w-3 h-3" />}
                          {run.status}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono">
                        Started: {new Date(run.startedAt).toLocaleString()}
                      </div>

                      {run.output && (
                        <div className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 font-mono max-h-24 overflow-y-auto whitespace-pre-wrap">
                          {run.output}
                        </div>
                      )}

                      {run.error && (
                        <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-100 font-mono">
                          {run.error}
                        </div>
                      )}

                      {/* Approval Gate Buttons */}
                      {run.status === "needs_approval" && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                          <p className="text-[11px] text-amber-900 font-medium">
                            ⚠️ Irreversible action pending your decision:
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700 text-white font-medium"
                              onClick={() => approvalMutation.mutate({ runId: run.id, decision: "approve" })}
                              disabled={approvalMutation.isPending}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 font-medium"
                              onClick={() => approvalMutation.mutate({ runId: run.id, decision: "reject" })}
                              disabled={approvalMutation.isPending}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MANAGEMENT */}
          {activeTab === "management" && (
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-semibold text-slate-800">Agent Activity Status</h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">
                    {isActive ? "Active (Responds & Runs routines)" : "Paused (Offline)"}
                  </span>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => {
                      setIsActive(e.target.checked);
                      updateMutation.mutate({ isActive: e.target.checked });
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-3">
                <h4 className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" /> Danger Zone
                </h4>
                <p className="text-[11px] text-red-600/80 leading-relaxed">
                  Deleting this agent will permanently remove its chat history, routines, and configurations.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this agent?")) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="w-full h-8 text-xs bg-red-600 hover:bg-red-700 font-medium"
                >
                  <Trash className="w-3.5 h-3.5 mr-1.5" /> Delete Agent
                </Button>
              </div>

              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-slate-600" /> Account Management
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Delete your account, revoke all Composio connections, and erase all personal data.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure? This will delete ALL your agents, routines, and account data!")) {
                      deleteAccountMutation.mutate();
                    }
                  }}
                  disabled={deleteAccountMutation.isPending}
                  className="w-full h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 font-medium mt-1"
                >
                  Delete Account & Erase All Data
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
