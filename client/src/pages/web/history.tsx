import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BarChart3 } from "lucide-react";
import { useWebHistory } from "@/lib/webApi";

const DAYS_OPTIONS = [14, 30, 90];

const BAND_COLORS: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800 border-emerald-300",
  B: "bg-blue-100 text-blue-800 border-blue-300",
  C: "bg-amber-100 text-amber-800 border-amber-300",
  D: "bg-red-100 text-red-800 border-red-300",
};

export default function History() {
  const [days, setDays] = useState(30);
  const { data: history, isLoading } = useWebHistory(days);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-emerald-600" />
        Score History
      </h2>

      <div className="flex gap-2">
        {DAYS_OPTIONS.map((d) => (
          <Button
            key={d}
            variant={days === d ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(d)}
            data-testid={`button-days-${d}`}
          >
            {d} days
          </Button>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : !history || history.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8" data-testid="text-no-history">
              No score history found for the selected period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-4 py-2 font-medium text-slate-600">Date</th>
                    <th className="text-right px-4 py-2 font-medium text-slate-600">Score</th>
                    <th className="text-center px-4 py-2 font-medium text-slate-600">Band</th>
                    <th className="text-right px-4 py-2 font-medium text-slate-600">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                      data-testid={`row-history-${item.id}`}
                    >
                      <td className="px-4 py-2 text-slate-700">
                        {new Date(item.asOfDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-slate-900">
                        {item.score}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Badge className={BAND_COLORS[item.band] || ""} data-testid={`badge-band-${item.id}`}>
                          {item.band}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right text-slate-600">
                        {item.confidence}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
