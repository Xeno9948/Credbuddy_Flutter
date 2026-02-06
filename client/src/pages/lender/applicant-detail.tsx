import React, { useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, Download, Share2, Info, TrendingUp } from "lucide-react";
import { useAppStore } from "@/lib/mock-store";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ApplicantDetail() {
  const { user } = useAppStore();
  const packetRef = useRef<HTMLDivElement>(null);

  // Mock historical data for trend chart
  const historyData = Array.from({ length: 12 }, (_, i) => ({
    month: `Month ${i+1}`,
    score: Math.min(1000, Math.max(0, user.creditScore.score - (12-i)*15 + Math.random()*30))
  }));

  const handlePrint = () => {
    // In a real app this would trigger a PDF generation service or window.print() with print-specific CSS
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 print:bg-white print:pb-0">
      
      {/* Print-only Header */}
      <div className="hidden print:block border-b border-slate-200 pb-4 mb-8">
         <h1 className="text-2xl font-bold text-slate-900">Credit & Cashflow Decision Packet</h1>
         <p className="text-slate-500 text-sm">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* Screen Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <Link href="/partner">
               <Button variant="ghost" size="sm" className="gap-2">
                 <ArrowLeft className="w-4 h-4" /> Back
               </Button>
             </Link>
             <div className="h-6 w-px bg-slate-200" />
             <div className="flex flex-col">
               <span className="font-bold text-slate-900 leading-tight">{user.businessName}</span>
               <span className="text-xs text-slate-500">Applicant ID: #APP-2026-884</span>
             </div>
           </div>
           <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
               <Printer className="w-4 h-4" /> Print Packet
             </Button>
             <Button className="bg-emerald-900 hover:bg-emerald-800 gap-2">
               <Download className="w-4 h-4" /> Export JSON
             </Button>
           </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8" ref={packetRef}>
        
        {/* Executive Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-2 shadow-sm print:shadow-none print:border">
             <CardHeader className="pb-4">
               <CardTitle>Executive Summary</CardTitle>
               <CardDescription>AI-generated risk assessment</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="prose prose-sm text-slate-700 max-w-none">
                  <p className="mb-3">
                    <strong className="text-slate-900">{user.businessName} ({user.businessType})</strong> shows 
                    <strong className="text-emerald-700"> strong repayment potential</strong> based on consistent daily revenue reporting (Data Discipline: {(user.creditScore.featureBreakdown.dd * 100).toFixed(0)}%).
                  </p>
                  <p className="mb-3">
                    Revenue stability is {user.creditScore.featureBreakdown.rs > 0.6 ? 'high' : 'moderate'}, with a net cashflow that supports a micro-loan repayment capacity of approx. R850/pm.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
                      Recommendation: Approve (Tier {user.creditScore.band})
                    </Badge>
                    <Badge variant="outline" className="text-slate-600">
                      Max Exposure: R5,000
                    </Badge>
                    <Badge variant="outline" className="text-slate-600">
                      Term: 3-6 Months
                    </Badge>
                  </div>
                </div>
             </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white shadow-lg print:shadow-none print:bg-white print:text-black print:border">
             <CardContent className="p-6 flex flex-col justify-between h-full">
                <div>
                   <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Credit Score v1</p>
                   <div className="flex items-baseline gap-2">
                     <h1 className="text-6xl font-display font-bold">{user.creditScore.score}</h1>
                     <span className="text-2xl opacity-80">/ 1000</span>
                   </div>
                </div>
                
                <div className="space-y-4 mt-6">
                   <div className="flex justify-between items-center border-t border-slate-700 pt-4 print:border-slate-200">
                     <span className="text-slate-300 print:text-slate-600">Risk Band</span>
                     <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 print:bg-white print:text-black print:border">{user.creditScore.band}</Badge>
                   </div>
                   <div className="flex justify-between items-center border-t border-slate-700 pt-4 print:border-slate-200">
                     <span className="text-slate-300 print:text-slate-600">Confidence</span>
                     <span className="font-mono font-bold">{(user.creditScore.confidence * 100).toFixed(0)}%</span>
                   </div>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Breakdown & Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
           
           <Card className="shadow-sm print:shadow-none print:border">
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
                <CardDescription>Contributing factors to current score</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {[
                   { label: "Data Discipline", val: user.creditScore.featureBreakdown.dd, reason: "High consistency in daily reporting" },
                   { label: "Revenue Stability", val: user.creditScore.featureBreakdown.rs, reason: "Moderate variance in weekly income" },
                   { label: "Buffer Behavior", val: user.creditScore.featureBreakdown.bb, reason: "Cash reserves cover >2 days expenses" },
                 ].map((factor, i) => (
                   <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm font-medium">
                        <span>{factor.label}</span>
                        <span>{(factor.val * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden print:border print:bg-white">
                         <div className="h-full bg-emerald-600 print:bg-black" style={{ width: `${factor.val * 100}%` }} />
                      </div>
                      <p className="text-xs text-slate-500">{factor.reason}</p>
                   </div>
                 ))}
              </CardContent>
           </Card>

           <Card className="shadow-sm print:shadow-none print:border">
              <CardHeader>
                <CardTitle>90-Day Trend</CardTitle>
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

        {/* Risk Flags Section */}
        <div className="space-y-4">
           <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
             <Info className="w-5 h-5" /> Risk Factors & Disclaimers
           </h3>
           <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 print:bg-white print:border-slate-200">
              <ul className="space-y-2 text-sm text-amber-900 print:text-slate-700">
                {user.creditScore.flags.length > 0 ? (
                  user.creditScore.flags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2">
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
                  <span className="opacity-80">This report is for decision support only. Score v1 is experimental and based on self-reported cashflow data.</span>
                </li>
              </ul>
           </div>
        </div>

      </main>
    </div>
  );
}
