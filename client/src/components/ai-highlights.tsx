import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface InsightsResponse {
    insights: {
        trendObservation: string;
        strengthIndicators: string[];
        improvementOpportunities: string[];
        disclaimer: string;
    };
}

export function AIHighlights() {
    const { data, isLoading, isError } = useQuery<InsightsResponse>({
        queryKey: ["ai-insights"],
        queryFn: async () => {
            const res = await fetch("/api/ai/insights", { method: "POST" });
            if (!res.ok) throw new Error("Failed to fetch insights");
            return res.json();
        },
        retry: false,
        staleTime: 1000 * 60 * 60, // Cache for 1 hour
    });

    if (isError) return null; // Hide if AI fails or key missing

    if (isLoading) {
        return (
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 mb-6">
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-6 w-48" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const { insights } = data!;

    return (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-display flex items-center gap-2 text-indigo-900">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    AI Briefing & Insights
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Trend Analysis */}
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-indigo-800 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Trend Analysis
                    </h4>
                    <p className="text-sm text-indigo-900/80 leading-relaxed">
                        {insights.trendObservation}
                    </p>
                </div>

                {/* Strengths */}
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Key Strengths
                    </h4>
                    <ul className="text-sm text-emerald-900/80 space-y-1">
                        {insights.strengthIndicators.map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                {s}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Opportunities */}
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Opportunities
                    </h4>
                    <ul className="text-sm text-amber-900/80 space-y-1">
                        {insights.improvementOpportunities.map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                                {s}
                            </li>
                        ))}
                    </ul>
                </div>

            </CardContent>
        </Card>
    );
}
