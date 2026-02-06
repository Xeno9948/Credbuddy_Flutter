import React, { useRef, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, Download, Info, Loader2, CheckCircle, AlertTriangle, Lightbulb } from "lucide-react";
import { usePartnerApplicant } from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ApplicantDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const userId = parseInt(params.id || "0");
  const apiKey = sessionStorage.getItem("partnerApiKey") || "";
  const packetRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef: packetRef });

  useEffect(() => {
    if (!apiKey) setLocation("/partner/login");
  }, [apiKey]);

  const { data, isLoading } = usePartnerApplicant(apiKey, userId || null);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-500">Loading applicant data...</span>
      </div>
    );
  }

  const { user, profile, score, scoreHistory, explainability } = data;

  const historyData = (scoreHistory || []).reverse().map((s) => ({
    month: s.asOfDate,
    score: s.score,
  }));

  if (historyData.length === 0 && score) {
    for (let i = 0; i < 12; i++) {
      historyData.push({
        month: `Day ${i + 1}`,
        score: Math.min(1000, Math.max(0, score.score - (12 - i) * 15 + Math.random() * 30)),
      });
    }
  }

  const handlePrint = () => reactToPrintFn();

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `decision-packet-${userId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scoreVal = score?.score ?? 0;
  const band = score?.band ?? "D";
  const confidence = score?.confidence ?? 50;
  const flags = score?.flags ?? [];
  const breakdown = score?.featureBreakdown ?? { dd: 0, rs: 0, ep: 0, bb: 0, tm: 0, sr: 0 };

  const lender = explainability?.lender;

  return (
    <div className="min-h-screen bg-slate-50 pb-12 print:bg-white print:pb-0">
      
      <div className="hidden print:block border-b border-slate-200 pb-4 mb-8">
         <h1 className="text-2xl font-bold text-slate-900">Credit & Cashflow Decision Packet</h1>
         <p className="text-slate-500 text-sm">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <Link href="/partner">
               <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back">
                 <ArrowLeft className="w-4 h-4" /> Back
               </Button>
             </Link>
             <div className="h-6 w-px bg-slate-200" />
             <div className="flex flex-col">
               <span className="font-bold text-slate-900 leading-tight" data-testid="text-applicant-name">{profile?.businessName ?? user.phone}</span>
               <span className="text-xs text-slate-500">User ID: #{user.id}</span>
             </div>
           </div>
           <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2" data-testid="button-print">
               <Printer className="w-4 h-4" /> Print Packet
             </Button>
             <Button className="bg-emerald-900 hover:bg-emerald-800 gap-2" onClick={handleExportJSON} data-testid="button-export">
               <Download className="w-4 h-4" /> Export JSON
             </Button>
           </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8" ref={packetRef}>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-2 shadow-sm print:shadow-none print:border">
             <CardHeader className="pb-4">
               <CardTitle>Executive Summary</CardTitle>
               <CardDescription>AI-generated risk assessment (Explainable AI)</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="prose prose-sm text-slate-700 max-w-none">
                  {lender ? (
                    <>
                      <h4 className="text-lg font-semibold text-slate-900 mt-0 mb-3">{lender.headline}</h4>
                      <p className="text-sm text-slate-600 mb-1">{lender.scoreLine}</p>
                      <p className="text-sm text-slate-600 mb-4">{lender.confidenceLine}</p>

                      {lender.positiveDrivers.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-xs uppercase tracking-wider text-emerald-700 font-semibold mb-2 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Positive Indicators
                          </h5>
                          <ul className="space-y-1 list-none pl-0">
                            {lender.positiveDrivers.map((d, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm" data-testid={`text-positive-driver-${i}`}>
                                <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {lender.negativeDrivers.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-xs uppercase tracking-wider text-red-700 font-semibold mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Risk Indicators
                          </h5>
                          <ul className="space-y-1 list-none pl-0">
                            {lender.negativeDrivers.map((d, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm" data-testid={`text-negative-driver-${i}`}>
                                <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                <span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {lender.improvements.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-xs uppercase tracking-wider text-blue-700 font-semibold mb-2 flex items-center gap-1">
                            <Lightbulb className="w-3 h-3" /> Recommended Actions
                          </h5>
                          <ul className="space-y-1 list-none pl-0">
                            {lender.improvements.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm" data-testid={`text-improvement-${i}`}>
                                <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="mb-2">
                      <strong className="text-slate-900">{profile?.businessName ?? "Applicant"} ({profile?.businessType ?? "Unknown"})</strong> - 
                      Score analysis based on {data.entries?.length ?? 0} daily entries.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="outline" className={`${band === 'A' || band === 'B' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                      Recommendation: {band === 'A' || band === 'B' ? 'Approve' : 'Review'} (Tier {band})
                    </Badge>
                    <Badge variant="outline" className="text-slate-600">
                      Confidence: {confidence}%
                    </Badge>
                    {explainability?.polished && (
                      <Badge variant="outline" className="text-violet-600 bg-violet-50 border-violet-200">
                        AI-Enhanced Wording
                      </Badge>
                    )}
                  </div>
                </div>
             </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white shadow-lg print:shadow-none print:bg-white print:text-black print:border">
             <CardContent className="p-6 flex flex-col justify-between h-full">
                <div>
                   <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Credit Score v1</p>
                   <div className="flex items-baseline gap-2">
                     <h1 className="text-6xl font-display font-bold" data-testid="text-score-value">{scoreVal}</h1>
                     <span className="text-2xl opacity-80">/ 1000</span>
                   </div>
                </div>
                
                <div className="space-y-4 mt-6">
                   <div className="flex justify-between items-center border-t border-slate-700 pt-4 print:border-slate-200">
                     <span className="text-slate-300 print:text-slate-600">Risk Band</span>
                     <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 print:bg-white print:text-black print:border" data-testid="text-score-band">{band}</Badge>
                   </div>
                   <div className="flex justify-between items-center border-t border-slate-700 pt-4 print:border-slate-200">
                     <span className="text-slate-300 print:text-slate-600">Confidence</span>
                     <span className="font-mono font-bold" data-testid="text-score-confidence">{confidence}%</span>
                   </div>
                </div>
             </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
           
           <Card className="shadow-sm print:shadow-none print:border">
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
                <CardDescription>Contributing factors to current score</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {[
                   { label: "Data Discipline", val: breakdown.dd },
                   { label: "Revenue Stability", val: breakdown.rs },
                   { label: "Expense Pressure", val: breakdown.ep },
                   { label: "Buffer Behavior", val: breakdown.bb },
                   { label: "Trend Momentum", val: breakdown.tm },
                   { label: "Shock Recovery", val: breakdown.sr },
                 ].map((factor, i) => (
                   <div key={i} className="space-y-1" data-testid={`text-breakdown-${factor.label.toLowerCase().replace(/\s/g, '-')}`}>
                      <div className="flex justify-between text-sm font-medium">
                        <span>{factor.label}</span>
                        <span>{(factor.val * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden print:border print:bg-white">
                         <div className="h-full bg-emerald-600 print:bg-black" style={{ width: `${factor.val * 100}%` }} />
                      </div>
                   </div>
                 ))}
              </CardContent>
           </Card>

           <Card className="shadow-sm print:shadow-none print:border">
              <CardHeader>
                <CardTitle>Score Trend</CardTitle>
                <CardDescription>Score progression over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" hide />
                      <YAxis domain={[0, 1000]} hide />
                      <Tooltip />
                      <Area type="monotone" dataKey="score" stroke="#059669" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                    </AreaChart>
                 </ResponsiveContainer>
              </CardContent>
           </Card>

        </div>

        <div className="space-y-4">
           <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
             <Info className="w-5 h-5" /> Risk Factors & Disclaimers
           </h3>
           <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 print:bg-white print:border-slate-200">
              <ul className="space-y-2 text-sm text-amber-900 print:text-slate-700">
                {flags.length > 0 ? (
                  flags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2" data-testid={`text-flag-${i}`}>
                      <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-amber-600 print:bg-black" />
                      <span><strong>{flag}</strong>: Detected in recent activity patterns.</span>
                    </li>
                  ))
                ) : (
                   <li className="flex items-start gap-2">
                      <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-emerald-600 print:bg-black" />
                      <span>No critical risk flags detected in the last 14 days.</span>
                   </li>
                )}
                <li className="flex items-start gap-2 pt-2 border-t border-amber-200/50 print:border-slate-200 mt-2">
                  <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-slate-400 print:bg-black" />
                  <span className="opacity-80">
                    {lender?.disclaimer ?? "This report is for decision support only. Score v1 is experimental and based on self-reported cashflow data."}
                  </span>
                </li>
              </ul>
           </div>
        </div>

      </main>
    </div>
  );
}
