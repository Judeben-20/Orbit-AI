"use client";

import React, { useRef, useEffect, useState } from "react";
import { useChat } from "ai/react";
import { AgentAvatar } from "@/components/ui/agent-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Calendar, Plug, CheckCircle, List } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Message } from "ai";

interface ChatInterfaceProps {
  agentId: string;
  agentName: string;
  avatarSeed: string;
  isActive: boolean;
}

interface MessageDbItem {
  id: string;
  role: "user" | "assistant" | "system" | "data";
  content: string;
  parts?: unknown[];
}

interface ToolAppItem {
  slug: string;
  reason?: string;
}

interface RoutineArgs {
  title?: string;
  prompt?: string;
  cron?: string;
  timezone?: string;
  requiredApps?: string[];
}

interface ChannelItem {
  id: string;
  name: string;
}

export function ChatInterface({ agentId, agentName, avatarSeed, isActive }: ChatInterfaceProps) {
  const queryClient = useQueryClient();
  const [confirmingRoutine, setConfirmingRoutine] = useState<string | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, error } = useChat({
    api: `/api/agents/${agentId}/chat`,
    id: agentId,
  });

  const { isLoading: loadingHistory } = useQuery({
    queryKey: ["chat-history", agentId],
    queryFn: async () => {
      const res = await fetch(`/api/agents/${agentId}/chat`);
      if (!res.ok) throw new Error("Failed to load history");
      const data: MessageDbItem[] = await res.json();

      const formattedMessages: Message[] = data.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        toolInvocations: (m.parts as unknown as Message["toolInvocations"]) || undefined,
      }));

      setMessages(formattedMessages);
      return data;
    },
    refetchOnWindowFocus: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleConfirmRoutine = async (args: RoutineArgs, callId: string) => {
    setConfirmingRoutine(callId);
    try {
      const res = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          title: args.title,
          prompt: args.prompt,
          cron: args.cron,
          timezone: args.timezone || "UTC",
          requiredApps: args.requiredApps || [],
        }),
      });

      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["routines", agentId] });
        alert("Routine confirmed & activated!");
      } else {
        const errText = await res.text();
        alert(`Error saving routine: ${errText}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to activate routine.");
    } finally {
      setConfirmingRoutine(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {loadingHistory ? (
          <div className="text-center text-xs text-slate-400 py-8 animate-pulse">Loading chat history...</div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
            <AgentAvatar seed={avatarSeed} size="lg" showOnline={isActive} />
            <div>
              <p className="font-medium text-slate-600 text-sm">
                This is the beginning of your chat with {agentName}.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Ask {agentName} to run tasks, connect tools, or schedule routines.
              </p>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role !== "user" && (
                <div className="shrink-0">
                  <AgentAvatar seed={avatarSeed} size="sm" showOnline={isActive} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none shadow-2xs font-medium"
                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-2xs space-y-2"
                }`}
              >
                {m.role !== "user" && (
                  <div className="text-[10px] font-semibold text-slate-400">{agentName}</div>
                )}
                {m.content && <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>}

                {/* Render Tool Invocations */}
                {m.toolInvocations?.map((tool) => {
                  const toolName = tool.toolName;
                  const args = (tool.args || {}) as Record<string, unknown>;
                  const callId = tool.toolCallId;

                  return (
                    <div
                      key={callId}
                      className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs text-xs space-y-2.5"
                    >
                      {/* TOOL 1: request_connections */}
                      {toolName === "request_connections" && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Plug className="w-4 h-4 text-blue-600" />
                            Action Required: Connect Tools
                          </div>
                          <p className="text-[11px] text-slate-500">
                            To fulfill your request, the following tool connections are required:
                          </p>
                          {(args.apps as ToolAppItem[])?.map((app, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-lg"
                            >
                              <div>
                                <span className="font-semibold capitalize text-slate-800">{app.slug}</span>
                                {app.reason && (
                                  <p className="text-[10px] text-slate-400">{app.reason}</p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                onClick={() => {
                                  fetch("/api/connections", {
                                    method: "POST",
                                    body: JSON.stringify({ appSlug: app.slug }),
                                  })
                                    .then((res) => res.json())
                                    .then((data) => {
                                      if (data.url) window.open(data.url, "_blank");
                                    });
                                }}
                              >
                                Connect
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* TOOL 2: propose_routine */}
                      {toolName === "propose_routine" && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            Proposed Routine: {(args as RoutineArgs).title}
                          </div>
                          {(args as RoutineArgs).prompt && (
                            <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100">
                              &quot;{(args as RoutineArgs).prompt}&quot;
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-mono">
                            <span className="bg-slate-200/60 px-1.5 py-0.5 rounded">
                              Schedule: {(args as RoutineArgs).cron}
                            </span>
                            <span className="bg-slate-200/60 px-1.5 py-0.5 rounded">
                              TZ: {(args as RoutineArgs).timezone || "UTC"}
                            </span>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium h-7 text-xs"
                              disabled={confirmingRoutine === callId}
                              onClick={() => handleConfirmRoutine(args as RoutineArgs, callId)}
                            >
                              {confirmingRoutine === callId ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              )}
                              Confirm &amp; Save Routine
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* TOOL 3: list_channels */}
                      {toolName === "list_channels" && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <List className="w-4 h-4 text-slate-600" />
                            Available Slack Channels
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            {tool.state === "result" &&
                              (tool.result as { channels?: ChannelItem[] })?.channels?.map((ch) => (
                                <div
                                  key={ch.id}
                                  className="bg-white p-1.5 border border-slate-200 rounded font-mono text-slate-700 text-center"
                                >
                                  {ch.name}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            ⚠️ {error.message || "An error occurred during response streaming."}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)]">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-3 relative items-center">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={isActive ? `Message ${agentName}...` : "Agent is paused"}
            disabled={!isActive || isLoading}
            className="flex-1 rounded-full pl-4 pr-12 py-5 text-xs border-slate-200 bg-slate-50 shadow-inner focus-visible:ring-blue-500"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!isActive || isLoading || !input.trim()}
            className="absolute right-1.5 rounded-full w-8 h-8 bg-blue-600 hover:bg-blue-700 shadow-2xs transition-transform active:scale-95"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Send className="w-3.5 h-3.5 text-white" />}
          </Button>
        </form>
        <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
          Agents can make mistakes. Check important information.
        </p>
      </div>
    </div>
  );
}
