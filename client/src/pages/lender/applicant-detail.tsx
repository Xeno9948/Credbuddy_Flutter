import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Download, Loader2, CheckCircle, AlertTriangle,
  Lightbulb, RefreshCw, Share2, Copy, Check, FileText,
  Calendar, Database, TrendingUp, TrendingDown, Minus, Shield
} from "lucide-react";
import { usePartnerApplicant, usePartnerRecalc, useCreateShareLink } from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";

function confidenceLabel(c: number): string {
  if (c >= 80) return "High";
  if (c >= 60) return "Moderate";
  if (c >= 40) return "Limited";
  return "Low";
}

function featureLevel(val: number): string {
  if (val >= 0.7) return "Higher";
  if (val >= 0.4) return "Moderate";
  return "Lower";
}

function trendLabel(val: number): string {
  if (val >= 0.6) return "Up";
  if (val >= 0.3) return "Flat";
  return "Down";
}

function levelColor(level: string): string {
  if (level === "Higher" || level === "High" || level === "Up") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (level === "Moderate" || level === "Limited" || level === "Flat") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-slate-700 bg-slate-100 border-slate-300";
}

function TrendIcon({ direction }: { direction: string }) {
  if (direction === "Up") return <TrendingUp className="w-4 h-4 text-emerald-600" />;
  if (direction === "Down") return <TrendingDown className="w-4 h-4 text-slate-500" />;
  return <Minus className="w-4 h-4 text-amber-500" />;
}

const DISCLAIMER = "Decision-support only. Final decisions remain with you.";

export default function ApplicantDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const userId = parseInt(params.id || "0");
  const apiKey = sessionStorage.getItem("partnerApiKey") || "";
  const [historyRange, setHistoryRange] = useState<14 | 30 | 90>(14);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const recalcMutation = usePartnerRecalc();
  const shareMutation = useCreateShareLink();

  useEffect(() => {
    if (!apiKey) setLocation("/partner/login");
  }, [apiKey]);

  const { data, isLoading, refetch } = usePartnerApplicant(apiKey, userId || null);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-500">Loading assessment data...</span>
      </div>
    );
  }

  const { user, profile, score, scoreHistory, explainability, entries, cashEstimate } = data;

  const scoreVal = score?.score ?? 0;
  const band = score?.band ?? "D";
  const confidence = score?.confidence ?? 50;
  const flags = score?.flags ?? [];
  const breakdown = score?.featureBreakdown ?? { dd: 0, rs: 0, ep: 0, bb: 0, tm: 0, sr: 0 };
  const lender = explainability?.lender;

  const allHistory = (scoreHistory || []).slice().reverse();
  const filteredHistory = allHistory.slice(-historyRange).map((s) => ({
    date: s.asOfDate,
    score: s.score,
    confidence: s.confidence ?? 0,
  }));

  const activeDays = (entries || []).length;
  const hasExpenses = (entries || []).filter((e: any) => e.expenseCents > 0).length;
  const expenseLevel = hasExpenses >= 10 ? "Full" : hasExpenses >= 5 ? "Partial" : "None";

  const handleDownloadPDF = () => {
    const link = document.createElement("a");
    link.href = `/api/v1/users/${userId}/credit-report.pdf`;
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `/api/v1/users/${userId}/credit-report.pdf`);
    xhr.setRequestHeader("X-API-KEY", apiKey);
    xhr.responseType = "blob";
    xhr.onload = () => {
      const url = URL.createObjectURL(xhr.response);
      const a = document.createElement("a");
      a.href = url;
      a.download = `credit-report-${userId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    };
    xhr.send();
  };

  const handleRecalc = async () => {
    await recalcMutation.mutateAsync({ apiKey, userId });
    refetch();
  };

  const handleShareLink = async () => {
    const result = await shareMutation.mutateAsync({ apiKey, userId });
    const link = `${window.location.origin}/share/${result.token}`;
    setShareLink(link);
  };

  const handleCopy = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
        <p className="text-center text-sm text-amber-800 font-medium flex items-center justify-center gap-2" data-testid="text-disclaimer-banner">
          <Shield className="w-4 h-4" />
          {DISCLAIMER}
        </p>
      </div>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/partner">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </Link>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 leading-tight" data-testid="text-applicant-name">
                Credit Risk Assessment
              </span>
              <span className="text-xs text-slate-500">{profile?.businessName ?? user.phone}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalc}
              disabled={recalcMutation.isPending}
              className="gap-2"
              data-testid="button-recalc"
            >
              <RefreshCw className={`w-4 h-4 ${recalcMutation.isPending ? "animate-spin" : ""}`} />
              Request Updated Assessment
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareLink}
              disabled={shareMutation.isPending}
              className="gap-2"
              data-testid="button-share"
            >
              <Share2 className="w-4 h-4" />
              Share Secure Link
            </Button>
            <Button
              className="bg-emerald-900 hover:bg-emerald-800 gap-2"
              size="sm"
              onClick={handleDownloadPDF}
              data-testid="button-download-pdf"
            >
              <Download className="w-4 h-4" /> Download Credit Report (PDF)
            </Button>
          </div>
        </div>
      </header>

      {shareLink && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">Secure link created (expires in 7 days):</p>
              <code className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded mt-1 inline-block break-all" data-testid="text-share-link">
                {shareLink}
              </code>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1 shrink-0" data-testid="button-copy-link">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900 text-white shadow-lg col-span-1">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Credit Score v1</p>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-5xl font-display font-bold" data-testid="text-score-value">{scoreVal}</h1>
                  <span className="text-xl opacity-60">/ 1000</span>
                </div>
                <p className="text-slate-400 text-xs mt-2">Based on the last 14 days</p>
              </div>
              <div className="space-y-3 mt-6">
                <div className="flex justify-between items-center border-t border-slate-700 pt-3">
                  <span className="text-slate-400 text-sm">Band</span>
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-600" data-testid="text-score-band">
                    {band}
                  </Badge>
                </div>
                <div className="flex justify-between items-center border-t border-slate-700 pt-3">
                  <span className="text-slate-400 text-sm">Confidence</span>
                  <span className="font-mono font-bold text-sm" data-testid="text-score-confidence">
                    {(confidence / 100).toFixed(2)} — {confidenceLabel(confidence)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Risk Indicators</CardTitle>
              <CardDescription>Derived from scoring features — neutral assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Revenue Stability", val: featureLevel(breakdown.rs), raw: breakdown.rs },
                  { label: "Cash Buffer", val: featureLevel(breakdown.bb), raw: breakdown.bb },
                  { label: "Data Discipline", val: featureLevel(breakdown.dd), raw: breakdown.dd },
                  { label: "Trend Momentum", val: trendLabel(breakdown.tm), raw: breakdown.tm, isTrend: true },
                  { label: "Expense Pressure", val: featureLevel(breakdown.ep), raw: breakdown.ep },
                  { label: "Shock Recovery", val: featureLevel(breakdown.sr), raw: breakdown.sr },
                ].map((indicator, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-lg border ${levelColor(indicator.val)}`}
                    data-testid={`text-indicator-${indicator.label.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <div className="flex items-center gap-2">
                      {indicator.isTrend ? (
                        <TrendIcon direction={indicator.val} />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                      )}
                      <span className="text-sm font-medium">{indicator.label}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {indicator.val} ({(indicator.raw * 100).toFixed(0)}%)
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              Explainable Summary
            </CardTitle>
            <CardDescription>AI-generated risk assessment (Explainable AI, analyst tone)</CardDescription>
          </CardHeader>
          <CardContent>
            {lender ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {lender.positiveDrivers.length > 0 && (
                  <div>
                    <h5 className="text-xs uppercase tracking-wider text-emerald-700 font-semibold mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Strengths
                    </h5>
                    <ul className="space-y-1.5">
                      {lender.positiveDrivers.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700" data-testid={`text-positive-driver-${i}`}>
                          <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {lender.negativeDrivers.length > 0 && (
                  <div>
                    <h5 className="text-xs uppercase tracking-wider text-amber-700 font-semibold mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Risk Indicators
                    </h5>
                    <ul className="space-y-1.5">
                      {lender.negativeDrivers.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700" data-testid={`text-negative-driver-${i}`}>
                          <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {lender.improvements.length > 0 && (
                  <div>
                    <h5 className="text-xs uppercase tracking-wider text-blue-700 font-semibold mb-2 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" /> Suggested Actions
                    </h5>
                    <ul className="space-y-1.5">
                      {lender.improvements.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700" data-testid={`text-improvement-${i}`}>
                          <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No explainability data available. Request an updated assessment.</p>
            )}

            {flags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h5 className="text-xs uppercase tracking-wider text-amber-700 font-semibold mb-2">Flags</h5>
                <div className="flex flex-wrap gap-2">
                  {flags.map((flag, i) => (
                    <Badge key={i} variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-xs" data-testid={`text-flag-${i}`}>
                      {flag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Score History</CardTitle>
                <CardDescription>Score and confidence over time</CardDescription>
              </div>
              <div className="flex gap-1">
                {([14, 30, 90] as const).map((range) => (
                  <Button
                    key={range}
                    variant={historyRange === range ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHistoryRange(range)}
                    className={historyRange === range ? "bg-emerald-900 hover:bg-emerald-800" : ""}
                    data-testid={`button-range-${range}`}
                  >
                    {range}d
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            {filteredHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="score" domain={[0, 1000]} tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="conf" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} hide />
                  <Tooltip />
                  <Line yAxisId="score" type="monotone" dataKey="score" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} name="Score" />
                  <Line yAxisId="conf" type="monotone" dataKey="confidence" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Confidence %" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No score history available for this period.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-500" />
              Data Coverage
            </CardTitle>
            <CardDescription>Quality and completeness of submitted data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg" data-testid="text-active-days">
                <p className="text-2xl font-display font-bold text-slate-900">{activeDays}</p>
                <p className="text-xs text-slate-500 mt-1">Active days (last 14)</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg" data-testid="text-expense-tracking">
                <p className="text-2xl font-display font-bold text-slate-900">{expenseLevel}</p>
                <p className="text-xs text-slate-500 mt-1">Expense tracking</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg" data-testid="text-cash-estimates">
                <p className="text-2xl font-display font-bold text-slate-900">{cashEstimate ? "Yes" : "0"}</p>
                <p className="text-xs text-slate-500 mt-1">Cash estimates provided</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Disclaimer:</strong> CredBuddy provides data-driven credit risk insights for informational purposes only. CredBuddy does not provide financial advice, credit decisions, or recommendations. The final decision remains entirely with the user or authorized partner.
          </p>
        </div>

      </main>
    </div>
  );
}
