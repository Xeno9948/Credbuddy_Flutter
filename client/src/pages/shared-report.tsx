import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Minus, Database, FileText } from "lucide-react";
import { useSharedReport } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function confidenceLabel(c: number): string {
  if (c >= 80) return "Strong";
  if (c >= 60) return "Good";
  if (c >= 40) return "Medium";
  return "Low";
}

function levelColor(level: string): string {
  if (level === "Good" || level === "Up") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (level === "Medium" || level === "Flat") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-slate-700 bg-slate-100 border-slate-300";
}

function TrendIcon({ direction }: { direction: string }) {
  if (direction === "Up") return <TrendingUp className="w-4 h-4 text-emerald-600" />;
  if (direction === "Down") return <TrendingDown className="w-4 h-4 text-slate-500" />;
  return <Minus className="w-4 h-4 text-amber-500" />;
}

const DISCLAIMER = "This report is for decision-support purposes only. It does not constitute financial advice, a credit decision, or a guarantee of any outcome. Score v1 is experimental and based on self-reported cashflow data. Final credit decisions remain with the partner.";

export default function SharedReport() {
  const params = useParams<{ token: string }>();
  const { data, isLoading, error } = useSharedReport(params.token || null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-500">Loading report...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Report Unavailable</h2>
            <p className="text-slate-500">{(error as Error)?.message || "This link may have expired or is invalid."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { score, riskIndicators, explainability, scoreHistory, dataCoverage } = data;
  const lender = explainability?.lender;

  const historyData = scoreHistory.map(s => ({
    date: s.date,
    score: s.score,
    confidence: s.confidence,
  }));

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
        <p className="text-center text-sm text-amber-800 font-medium flex items-center justify-center gap-2">
          <Shield className="w-4 h-4" />
          Decision-support only. Final credit decisions remain with the partner.
        </p>
      </div>

      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Credit Risk Assessment</h1>
            <p className="text-sm text-slate-500">Shared report — view only</p>
          </div>
          <Badge variant="outline" className="text-xs text-slate-500">
            Expires: {new Date(data.expiresAt).toLocaleDateString()}
          </Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900 text-white shadow-lg">
            <CardContent className="p-6">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Credit Score v1</p>
              <div className="flex items-baseline gap-2">
                <h1 className="text-5xl font-display font-bold" data-testid="text-shared-score">{score?.score ?? "N/A"}</h1>
                <span className="text-xl opacity-60">/ 1000</span>
              </div>
              <p className="text-slate-400 text-xs mt-2">Based on the last 14 days</p>
              <div className="space-y-3 mt-6">
                <div className="flex justify-between items-center border-t border-slate-700 pt-3">
                  <span className="text-slate-400 text-sm">Band</span>
                  <Badge className="bg-emerald-500 text-white">{score?.band ?? "N/A"}</Badge>
                </div>
                <div className="flex justify-between items-center border-t border-slate-700 pt-3">
                  <span className="text-slate-400 text-sm">Confidence</span>
                  <span className="font-mono font-bold text-sm">
                    {score ? `${(score.confidence / 100).toFixed(2)} — ${confidenceLabel(score.confidence)}` : "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Business Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Business Name</span>
                <span className="font-medium text-slate-900">{data.businessName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Business Type</span>
                <span className="font-medium text-slate-900">{data.businessType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Phone</span>
                <span className="font-medium text-slate-900">{data.phone}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Risk Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Revenue Stability", val: riskIndicators.revenueStability },
                { label: "Cash Buffer", val: riskIndicators.cashBuffer },
                { label: "Data Discipline", val: riskIndicators.dataDiscipline },
                { label: "Trend Momentum", val: riskIndicators.trendMomentum, isTrend: true },
                { label: "Expense Pressure", val: riskIndicators.expensePressure },
                { label: "Shock Recovery", val: riskIndicators.shockRecovery },
              ].map((ind, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${levelColor(ind.val)}`}>
                  <div className="flex items-center gap-2">
                    {ind.isTrend ? <TrendIcon direction={ind.val} /> : <div className="w-2 h-2 rounded-full bg-current opacity-60" />}
                    <span className="text-sm font-medium">{ind.label}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{ind.val}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {lender && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Explainable Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {lender.positiveDrivers.length > 0 && (
                  <div>
                    <h5 className="text-xs uppercase tracking-wider text-emerald-700 font-semibold mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Strengths
                    </h5>
                    <ul className="space-y-1.5">
                      {lender.positiveDrivers.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
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
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {lender.flags && lender.flags.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h5 className="text-xs uppercase tracking-wider text-amber-700 font-semibold mb-2">Flags</h5>
                  <div className="flex flex-wrap gap-2">
                    {lender.flags.map((flag, i) => (
                      <Badge key={i} variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-xs">{flag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {historyData.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Score History</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 1000]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-500" />
              Data Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-display font-bold text-slate-900">{dataCoverage.activeDays}</p>
                <p className="text-xs text-slate-500 mt-1">Active days (last 14)</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-display font-bold text-slate-900">{dataCoverage.expenseTracking}</p>
                <p className="text-xs text-slate-500 mt-1">Expense tracking</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-display font-bold text-slate-900">{dataCoverage.cashEstimatesCount}</p>
                <p className="text-xs text-slate-500 mt-1">Cash estimates provided</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Disclaimer:</strong> {DISCLAIMER}
          </p>
        </div>
      </main>
    </div>
  );
}
