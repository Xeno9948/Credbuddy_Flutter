import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, MessageCircle, BarChart3, Shield, Smartphone,
  CreditCard, HelpCircle, CheckCircle, AlertTriangle, Star
} from "lucide-react";

export default function UserManual() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-emerald-950 text-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-emerald-200 hover:text-white hover:bg-emerald-900 gap-2" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" /> Home
            </Button>
          </Link>
          <div className="h-6 w-px bg-emerald-800" />
          <h1 className="font-display font-semibold text-lg">User Manual</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        <div className="text-center space-y-3 py-4">
          <h1 className="text-3xl font-display font-bold text-slate-900" data-testid="text-manual-title">
            AI Credit & Cashflow Assistant
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Your guide to building a stronger financial profile, one day at a time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-emerald-50 border-emerald-200 shadow-sm">
            <CardContent className="p-5 text-center space-y-2">
              <Smartphone className="w-8 h-8 text-emerald-700 mx-auto" />
              <h3 className="font-semibold text-emerald-900">For Entrepreneurs</h3>
              <p className="text-sm text-emerald-700">Track daily revenue & expenses via WhatsApp</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200 shadow-sm">
            <CardContent className="p-5 text-center space-y-2">
              <BarChart3 className="w-8 h-8 text-blue-700 mx-auto" />
              <h3 className="font-semibold text-blue-900">Credit Score</h3>
              <p className="text-sm text-blue-700">Get a score from 0–1000 based on your habits</p>
            </CardContent>
          </Card>
          <Card className="bg-violet-50 border-violet-200 shadow-sm">
            <CardContent className="p-5 text-center space-y-2">
              <Shield className="w-8 h-8 text-violet-700 mx-auto" />
              <h3 className="font-semibold text-violet-900">Lender Portal</h3>
              <p className="text-sm text-violet-700">Risk dashboards & decision packets for lenders</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm" id="getting-started">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Star className="w-5 h-5 text-amber-500" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700">
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900">Step 1: Open the Chat</h4>
              <p>
                On the main dashboard, you'll see a WhatsApp-style chat simulator on the left.
                This is where you interact with your AI Credit Assistant.
              </p>

              <h4 className="font-semibold text-slate-900">Step 2: Start Logging</h4>
              <p>
                Type <Badge variant="outline" className="font-mono">R500</Badge> to log R500 in revenue for today.
                Type <Badge variant="outline" className="font-mono">200 transport</Badge> to log R200 in transport expenses.
              </p>

              <h4 className="font-semibold text-slate-900">Step 3: Check Your Score</h4>
              <p>
                Type <Badge variant="outline" className="font-mono">SCORE</Badge> to see your credit score with a full breakdown
                of what's going well and what you can improve.
              </p>

              <h4 className="font-semibold text-slate-900">Step 4: Keep Going</h4>
              <p>
                The more consistently you log, the better your score gets. Even logging R0 on slow days helps
                because it shows you're tracking your business.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm" id="subscribe">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              How to Subscribe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h4 className="font-semibold text-emerald-900 mb-2">Free Tier</h4>
              <ul className="space-y-1 text-sm text-emerald-800">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Daily revenue & expense logging</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Basic credit score (updated on request)</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Weekly status snapshot</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Cashflow tips & improvement suggestions</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Premium Tier (Coming Soon)</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li className="flex items-center gap-2"><Star className="w-4 h-4 text-blue-600" /> AI-powered cashflow predictions</li>
                <li className="flex items-center gap-2"><Star className="w-4 h-4 text-blue-600" /> Loan scenario simulations</li>
                <li className="flex items-center gap-2"><Star className="w-4 h-4 text-blue-600" /> Automatic daily reminders via WhatsApp</li>
                <li className="flex items-center gap-2"><Star className="w-4 h-4 text-blue-600" /> Priority matching with lending partners</li>
              </ul>
            </div>

            <p className="text-sm text-slate-500">
              To subscribe, simply message the AI assistant with <Badge variant="outline" className="font-mono">SUBSCRIBE</Badge> or 
              contact your local agent. Subscription management is handled through WhatsApp.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm" id="commands">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Chat Commands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-commands">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-2 font-semibold text-slate-900">Command</th>
                    <th className="text-left py-3 px-2 font-semibold text-slate-900">What it does</th>
                    <th className="text-left py-3 px-2 font-semibold text-slate-900">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-2"><Badge variant="outline" className="font-mono">HELP</Badge></td>
                    <td className="py-3 px-2 text-slate-600">Show all available commands</td>
                    <td className="py-3 px-2 text-slate-500 font-mono text-xs">help</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2"><Badge variant="outline" className="font-mono">R[amount]</Badge></td>
                    <td className="py-3 px-2 text-slate-600">Log today's revenue</td>
                    <td className="py-3 px-2 text-slate-500 font-mono text-xs">R500</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2"><Badge variant="outline" className="font-mono">[amount] [note]</Badge></td>
                    <td className="py-3 px-2 text-slate-600">Log an expense with a note</td>
                    <td className="py-3 px-2 text-slate-500 font-mono text-xs">400 transport</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2"><Badge variant="outline" className="font-mono">CASH [amount]</Badge></td>
                    <td className="py-3 px-2 text-slate-600">Update your cash on hand</td>
                    <td className="py-3 px-2 text-slate-500 font-mono text-xs">cash 2000</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2"><Badge variant="outline" className="font-mono">STATUS</Badge></td>
                    <td className="py-3 px-2 text-slate-600">View your weekly cashflow snapshot</td>
                    <td className="py-3 px-2 text-slate-500 font-mono text-xs">status</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2"><Badge variant="outline" className="font-mono">SCORE</Badge></td>
                    <td className="py-3 px-2 text-slate-600">View your credit score with full explanation</td>
                    <td className="py-3 px-2 text-slate-500 font-mono text-xs">score</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2"><Badge variant="outline" className="font-mono">SCENARIO</Badge></td>
                    <td className="py-3 px-2 text-slate-600">Simulate a loan scenario</td>
                    <td className="py-3 px-2 text-slate-500 font-mono text-xs">scenario</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm" id="credit-score">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Understanding Your Credit Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700">
            <p>
              Your credit score ranges from <strong>0 to 1000</strong> and is calculated from 6 key areas
              of your financial behavior:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { name: "Data Discipline", desc: "How consistently you log your daily numbers" },
                { name: "Revenue Stability", desc: "How steady your income is from day to day" },
                { name: "Expense Pressure", desc: "Whether your expenses are manageable relative to revenue" },
                { name: "Buffer Behavior", desc: "How much cash reserve you maintain" },
                { name: "Trend Momentum", desc: "Whether your revenue is growing or declining" },
                { name: "Shock Recovery", desc: "How quickly you bounce back after a bad day" },
              ].map((f, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3" data-testid={`text-factor-${i}`}>
                  <h5 className="font-semibold text-slate-900 text-sm">{f.name}</h5>
                  <p className="text-xs text-slate-500 mt-1">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 mt-4">
              <h4 className="font-semibold text-slate-900">Score Bands</h4>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">A (750–1000) Excellent</Badge>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">B (500–749) Good</Badge>
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">C (250–499) Fair</Badge>
                <Badge className="bg-red-100 text-red-800 border-red-200">D (0–249) Needs Work</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm" id="lender-portal">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="w-5 h-5 text-violet-600" />
              Lender Partner Portal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-700">
            <p>
              The Lender Portal is designed for credit analysts and lending partners to review
              applicant profiles and make informed lending decisions.
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900">Accessing the Portal</h4>
              <p>
                Navigate to <Badge variant="outline" className="font-mono">/partner/login</Badge> and enter your
                API key. API keys are provided by your account administrator.
              </p>

              <h4 className="font-semibold text-slate-900">Dashboard Features</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span><strong>Overview Cards</strong> — Total applicants, average score, risk distribution at a glance</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span><strong>Risk Band Chart</strong> — Visual breakdown of applicants across A/B/C/D bands</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span><strong>Alerts</strong> — Flagged applicants with risk indicators requiring review</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span><strong>Applicant Detail</strong> — Full decision packet with AI-generated risk assessment</span>
                </li>
              </ul>

              <h4 className="font-semibold text-slate-900">Decision Packets</h4>
              <p>
                Click on any applicant to view their full decision packet, including score breakdown,
                trend charts, AI risk assessment, and exportable reports (JSON or printable PDF).
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-amber-200 bg-amber-50" id="disclaimer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-amber-900">
              <AlertTriangle className="w-5 h-5" />
              Important Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-800 space-y-2">
            <p>
              This system is a <strong>decision-support tool only</strong>. It does not make lending decisions,
              offer loans, or guarantee any financial outcome.
            </p>
            <p>
              Credit Score v1 is experimental and based on self-reported cashflow data. Scores should be used
              as one input among many in any lending decision process.
            </p>
            <p>
              The AI explanations are generated for informational purposes and do not constitute financial advice.
            </p>
          </CardContent>
        </Card>

        <div className="text-center py-6">
          <Link href="/">
            <Button className="bg-emerald-900 hover:bg-emerald-800 gap-2" data-testid="button-back-dashboard">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
