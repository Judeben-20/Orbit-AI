import Link from "next/link";
import { Store, ArrowLeft, Bot, Shield, Zap } from "lucide-react";

export default function MarketplacePage() {
  return (
    <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Agent Marketplace
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200/80 font-semibold px-2 py-0.5 rounded-full">
              Coming Soon
            </span>
          </h1>
          <p className="text-sm text-slate-500">
            Browse pre-built community agents and automated routine templates.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 md:p-12 text-center space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Community Templates & Agent Sharing
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Soon you will be able to publish your customized agents, share automated Slack & Gmail routines, and clone top-rated community templates in 1-click.
        </p>

        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Bot className="w-4 h-4 text-blue-600" /> Executive Assistant
            </div>
            <p className="text-[11px] text-slate-500">
              Daily morning email briefing + calendar summary to Slack.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Zap className="w-4 h-4 text-emerald-600" /> Support Desk Bot
            </div>
            <p className="text-[11px] text-slate-500">
              Scans unread emails and drafts response suggestions.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Shield className="w-4 h-4 text-purple-600" /> Security Auditor
            </div>
            <p className="text-[11px] text-slate-500">
              Weekly audit of automated channel posts and approval logs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
