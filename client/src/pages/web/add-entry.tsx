import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, PlusCircle } from "lucide-react";
import { useCreateWebEntry } from "@/lib/webApi";

export default function AddEntry() {
  const [, setLocation] = useLocation();
  const [revenue, setRevenue] = useState("");
  const [expense, setExpense] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
  const [success, setSuccess] = useState(false);

  const createEntry = useCreateWebEntry();

  const today = new Date().toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const revenueCents = Math.round(parseFloat(revenue) * 100);
    const expenseCents = expense ? Math.round(parseFloat(expense) * 100) : undefined;

    createEntry.mutate(
      {
        revenueCents,
        expenseCents,
        expenseNote: expenseNote || undefined,
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => setLocation("/web/app/entries"), 1500);
        },
      }
    );
  };

  return (
    <Card className="shadow-sm max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-emerald-600" />
          Add Daily Entry
        </CardTitle>
        <p className="text-sm text-slate-500 flex items-center gap-1" data-testid="text-date">
          <CalendarDays className="w-4 h-4" />
          {today}
        </p>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="text-center py-4 space-y-2" data-testid="text-success">
            <p className="text-emerald-700 font-medium">Entry saved successfully!</p>
            <p className="text-xs text-slate-500">Redirecting to entries…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="revenue">Revenue (R) *</Label>
              <Input
                id="revenue"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                required
                data-testid="input-revenue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense">Expenses (R)</Label>
              <Input
                id="expense"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={expense}
                onChange={(e) => setExpense(e.target.value)}
                data-testid="input-expense"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expenseNote">Expense Note</Label>
              <Input
                id="expenseNote"
                type="text"
                placeholder="Optional note"
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
                data-testid="input-expense-note"
              />
            </div>
            {createEntry.isError && (
              <p className="text-sm text-red-600" data-testid="text-error">
                {createEntry.error?.message || "Failed to save entry."}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-emerald-900 hover:bg-emerald-800 text-white"
              disabled={createEntry.isPending}
              data-testid="button-submit"
            >
              {createEntry.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
