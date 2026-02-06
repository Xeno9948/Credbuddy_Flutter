import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, AlertTriangle, TrendingUp } from "lucide-react";
import { useWebScore, useWebRecalc } from "@/lib/webApi";

const BAND_COLORS: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800 border-emerald-300",
  B: "bg-blue-100 text-blue-800 border-blue-300",
  C: "bg-amber-100 text-amber-800 border-amber-300",
  D: "bg-red-100 text-red-800 border-red-300",
};

const FEATURE_LABELS: Record<string, string> = {
  dd: "Data Discipline",
  rs: "Revenue Stability",
  ep: "Expense Pressure",
  bb: "Buffer / Balance",
  tm: "Trend Momentum",
  sr: "Shock Recovery",
};

export default function WebHome() {
  const { data, isLoading } = useWebScore();
  const recalc = useWebRecalc();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const score = data?.score;

  if (!score) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-8 text-center space-y-4">
          <TrendingUp className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-600" data-testid="text-no-score">
            No assessment data available yet.
          </p>
          <p className="text-xs text-slate-400">
            Submit daily entries to generate your first assessment.
          </p>
        </CardContent>
      </Card>
    );
  }

  const bandColor = BAND_COLORS[score.band] || BAND_COLORS.C;

  return (
    <div className="space-y-6">
      {data?.businessName && (
        <p className="text-sm text-slate-500" data-testid="text-business-name">
          {data.businessName}
        </p>
      )}

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                Credit Score
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className="text-5xl font-bold text-slate-900"
                  data-testid="text-score"
                >
                  {score.score}
                </span>
                <span className="text-lg text-slate-400">/1000</span>
              </div>
            </div>
            <div className="text-right space-y-2">
              <Badge className={bandColor} data-testid="badge-band">
                Band {score.band}
              </Badge>
              <p className="text-sm text-slate-500" data-testid="text-confidence">
                {score.confidence}% confidence
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            As of {new Date(score.asOfDate).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      {score.flags && score.flags.length > 0 && (
        <Card className="shadow-sm border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
              Risk Indicators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {score.flags.map((flag, i) => (
                <li
                  key={i}
                  className="text-sm text-slate-600"
                  data-testid={`text-flag-${i}`}
                >
                  • {flag}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {score.featureBreakdown && Object.keys(score.featureBreakdown).length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-700">
              Feature Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(score.featureBreakdown).map(([key, value]) => (
              <div key={key} data-testid={`feature-${key}`}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">
                    {FEATURE_LABELS[key] || key}
                  </span>
                  <span className="text-slate-500">{value}%</span>
                </div>
                <Progress value={value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() => recalc.mutate()}
        disabled={recalc.isPending}
        className="w-full bg-emerald-900 hover:bg-emerald-800 text-white gap-2"
        data-testid="button-recalc"
      >
        <RefreshCw className={`w-4 h-4 ${recalc.isPending ? "animate-spin" : ""}`} />
        {recalc.isPending ? "Calculating..." : "Request Updated Assessment"}
      </Button>
    </div>
  );
}
