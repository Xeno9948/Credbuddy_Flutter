import React from "react";
import { useSession } from "@/lib/session";
import { useUserDetail } from "@/lib/api";
import type { FeatureBreakdown } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertTriangle, ShieldCheck, DollarSign, Activity, Calendar, Info, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AIHighlights } from "./ai-highlights";
import { EmbeddedAIChat } from "./embedded-ai-chat";

export function AdminDashboard() {
  const { userId } = useSession();
  const { data, isLoading } = useUserDetail(userId);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-500">Loading dashboard data...</span>
      </div>
    );
  }

  const { user, profile, entries, score, cashEstimate } = data;

  const chartData = [...entries].reverse().map(e => ({
    date: format(new Date(e.date), 'dd MMM'),
    revenue: e.revenueCents / 100,
    expense: e.expenseCents / 100
  }));

  const totalRev = entries.reduce((a, b) => a + b.revenueCents, 0) / 100;
  const totalExp = entries.reduce((a, b) => a + b.expenseCents, 0) / 100;
  const net = totalRev - totalExp;

  const breakdown: FeatureBreakdown = score?.featureBreakdown ?? { dd: 0, rs: 0, ep: 0, bb: 0, tm: 0, sr: 0 };
  const flags = score?.flags ?? [];
  const scoreVal = score?.score ?? 0;
  const band = score?.band ?? "D";
  const confidence = score?.confidence ?? 50;

  const featureList = [
    { label: "Data Discipline", val: breakdown.dd, weight: "20%", desc: "Consistency of submissions" },
    { label: "Rev Stability", val: breakdown.rs, weight: "20%", desc: "Consistency of income" },
    { label: "Expense Pressure", val: breakdown.ep, weight: "15%", desc: "Profit margin health" },
    { label: "Buffer Behavior", val: breakdown.bb, weight: "20%", desc: "Cash reserves vs expenses" },
    { label: "Trend Momentum", val: breakdown.tm, weight: "10%", desc: "Week-over-week growth" },
    { label: "Shock Recovery", val: breakdown.sr, weight: "15%", desc: "Bounce back from bad days" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight" data-testid="text-dashboard-title">User Overview</h1>
          <p className="text-slate-500">Managing risk and cashflow for <span className="font-semibold text-slate-900" data-testid="text-business-name">{profile?.businessName ?? user.phone}</span></p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1 text-xs uppercase tracking-wider font-mono">
            Status: Active
          </Badge>
          <Badge className="px-3 py-1 text-xs uppercase tracking-wider font-mono bg-emerald-600">
            Last Active: {format(new Date(user.lastActiveAt), 'dd MMM')}
          </Badge>
        </div>
      </div>

      <AIHighlights />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-600 shadow-sm hover:shadow-md transition-shadow relative group">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => window.dispatchEvent(new CustomEvent('ai-consult', { detail: 'Explain my credit score factors' }))}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="sr-only">Explain Score</span>
          </Button>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Credit Score (v1)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold text-slate-900" data-testid="text-credit-score">{scoreVal}</span>
              <span className="text-sm font-medium text-emerald-600" data-testid="text-credit-band">Band {band}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1" data-testid="text-confidence">Confidence: {confidence}%</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-shadow relative group">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => window.dispatchEvent(new CustomEvent('ai-consult', { detail: 'Analyze my 14-day cashflow trend' }))}
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="sr-only">Analyze Cashflow</span>
          </Button>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" /> Net Cashflow (14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-slate-900" data-testid="text-net-cashflow">
              R{net.toLocaleString()}
            </div>
            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
              <span className="text-emerald-600">In: R{totalRev.toLocaleString()}</span>
              <span className="text-red-500">Out: R{totalExp.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Risk Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            {flags.length > 0 ? (
              <div className="space-y-1" data-testid="text-risk-flags">
                {flags.map((flag, i) => (
                  <Badge key={i} variant="destructive" className="mr-1">{flag}</Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500 italic" data-testid="text-no-flags">No active risk flags</div>
            )}
            <p className="text-xs text-muted-foreground mt-2">Shortfall Prediction: <span className="text-emerald-600 font-medium">Low Risk</span></p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Score Breakdown</CardTitle>
            <CardDescription>How the score is calculated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {featureList.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-sm group" data-testid={`text-feature-${f.label.toLowerCase().replace(/\s/g, '-')}`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-700">{f.label}</span>
                  <UiTooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-slate-400 opacity-50 hover:opacity-100 transition-opacity" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{f.desc} (Weight: {f.weight})</p>
                    </TooltipContent>
                  </UiTooltip>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                      style={{ width: `${f.val * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-slate-500 text-xs">{(f.val * 100).toFixed(0)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Cashflow Velocity</CardTitle>
            <CardDescription>Daily revenue vs expenses for the last 14 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R${val}`} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm flex flex-col lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4" /> Recent Entries
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto pr-2">
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0" data-testid={`row-entry-${entry.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{format(new Date(entry.date), 'EEE, dd MMM')}</p>
                      <p className="text-xs text-slate-500">{entry.expenseNote || 'Daily Input'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-700">+R{(entry.revenueCents / 100).toLocaleString()}</p>
                    {entry.expenseCents > 0 && (
                      <p className="text-xs text-red-500">-R{(entry.expenseCents / 100).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
              {entries.length === 0 && (
                <p className="text-sm text-slate-400 italic text-center py-4">No entries yet. Use the chat to log revenue.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EmbeddedAIChat className="lg:col-span-3 h-[500px]" />
      </div>
    </div>
  );
}
