import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, List } from "lucide-react";
import { useWebEntries } from "@/lib/webApi";

const DAYS_OPTIONS = [14, 30, 90];

function formatRands(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

export default function Entries() {
  const [days, setDays] = useState(30);
  const { data: entries, isLoading } = useWebEntries(days);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <List className="w-5 h-5 text-emerald-600" />
          Daily Entries
        </h2>
        <Link href="/web/app/add">
          <Button
            size="sm"
            className="bg-emerald-900 hover:bg-emerald-800 text-white gap-1"
            data-testid="button-add-entry"
          >
            <PlusCircle className="w-4 h-4" />
            Add Today's Entry
          </Button>
        </Link>
      </div>

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
          ) : !entries || entries.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8" data-testid="text-no-entries">
              No entries found for the selected period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-4 py-2 font-medium text-slate-600">Date</th>
                    <th className="text-right px-4 py-2 font-medium text-slate-600">Revenue (R)</th>
                    <th className="text-right px-4 py-2 font-medium text-slate-600">Expenses (R)</th>
                    <th className="text-right px-4 py-2 font-medium text-slate-600">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const net = entry.revenueCents - entry.expenseCents;
                    return (
                      <tr
                        key={entry.id}
                        className="border-b last:border-0 hover:bg-slate-50"
                        data-testid={`row-entry-${entry.id}`}
                      >
                        <td className="px-4 py-2 text-slate-700">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-right text-emerald-700">
                          {formatRands(entry.revenueCents)}
                        </td>
                        <td className="px-4 py-2 text-right text-red-600">
                          {formatRands(entry.expenseCents)}
                        </td>
                        <td
                          className={`px-4 py-2 text-right font-medium ${
                            net >= 0 ? "text-emerald-700" : "text-red-600"
                          }`}
                        >
                          {formatRands(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
