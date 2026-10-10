import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { PlusCircle, Bot, Settings, History } from "lucide-react";

export function Sidebar() {
  return (
    <div className="w-64 border-r border-slate-200 bg-white h-screen flex flex-col">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-slate-800 flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-600" />
          Orbit
        </Link>
        <UserButton afterSignOutUrl="/" />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Menu</div>
          <div className="space-y-1">
            <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md bg-indigo-50 text-indigo-700">
              <Bot className="w-4 h-4" />
              My Agents
            </Link>
            <Link href="/history" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-900">
              <History className="w-4 h-4" />
              Run History
            </Link>
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-900">
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agents</div>
            <Link href="/agents/new" className="text-slate-400 hover:text-indigo-600 transition-colors">
              <PlusCircle className="w-4 h-4" />
            </Link>
          </div>
          {/* Agent list will go here */}
          <div className="text-sm text-slate-500 italic px-3">Loading agents...</div>
        </div>
      </div>
    </div>
  );
}
