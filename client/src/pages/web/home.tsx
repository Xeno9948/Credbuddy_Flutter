import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, AlertTriangle, TrendingUp, Sparkles, Lightbulb } from "lucide-react";
import { useWebScore, useWebRecalc } from "@/lib/webApi";
import { useMutation } from "@tanstack/react-query";

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
  const [scoreExplanation, setScoreExplanation] = useState<string | null>(null);
  const [insights, setInsights] = useState<any>(null);

  const explainScoreMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai/explain-score", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to explain score");
      const data = await response.json();
      return data.explanation;
    },
    onSuccess: (explanation) => {
      setScoreExplanation(explanation);
    },
  });

  const insightsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch insights");
      const data = await response.json();
      return data.insights;
    },
    onSuccess: (data) => {
      setInsights(data);
    },
  });

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

          {/* Explain Score Button */}
          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={() => explainScoreMutation.mutate()}
              disabled={explainScoreMutation.isPending}
              variant="outline"
              className="w-full text-emerald-700 border-emerald-300 hover:bg-emerald-50"
            >
              <Sparkles className={`w-4 h-4 mr-2 ${explainScoreMutation.isPending ? "animate-spin" : ""}`} />
              {explainScoreMutation.isPending ? "Generating..." : "Explain My Score"}
            </Button>
          </div>

          {/* AI Score Explanation */}
          {scoreExplanation && (
            <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {scoreExplanation}
              </p>
            </div>
          )}
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

      {/* AI Insights Card */}
      <Card className="shadow-sm border-purple-200 bg-gradient-to-br from-purple-50 to-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between text-purple-700">
            <span className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              AI Insights
            </span>
            {!insights && (
              <Button
                onClick={() => insightsMutation.mutate()}
                disabled={insightsMutation.isPending}
                size="sm"
                variant="ghost"
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
              >
                {insightsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Generate"
                )}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insightsMutation.isPending && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          )}

          {insights && (
            <div className="space-y-3">
              {/* Trend Observation */}
              <div>
                <p className="text-xs font-medium text-purple-700 mb-1">Trend</p>
                <p className="text-sm text-slate-700">{insights.trendObservation}</p>
              </div>

              {/* Strengths */}
              {insights.strengthIndicators && insights.strengthIndicators.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1">Strengths</p>
                  <ul className="space-y-1">
                    {insights.strengthIndicators.map((strength: string, idx: number) => (
                      <li key={idx} className="text-sm text-slate-700">
                        ✓ {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvement Opportunities */}
              {insights.improvementOpportunities && insights.improvementOpportunities.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-700 mb-1">Growth Areas</p>
                  <ul className="space-y-1">
                    {insights.improvementOpportunities.map((opp: string, idx: number) => (
                      <li key={idx} className="text-sm text-slate-700">
                        → {opp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-xs text-slate-400 italic pt-2 border-t">
                {insights.disclaimer}
              </p>
            </div>
          )}

          {!insights && !insightsMutation.isPending && (
            <p className="text-sm text-slate-500 text-center py-4">
              Click "Generate" to get AI-powered insights about your financial data
            </p>
          )}
        </CardContent>
      </Card>

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
