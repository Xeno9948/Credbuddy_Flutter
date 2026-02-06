import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Shield } from "lucide-react";

const plans = [
  {
    name: "Pay-per-check",
    price: "\u20AC2.50",
    period: "per check",
    features: ["Single credit risk assessment", "PDF report download", "Secure sharing link", "14-day data window"],
    highlight: false,
  },
  {
    name: "Starter",
    price: "\u20AC99",
    period: "/month",
    features: ["100 checks included", "PDF report downloads", "Secure sharing links", "Dashboard access", "Email support"],
    highlight: false,
  },
  {
    name: "Growth",
    price: "\u20AC299",
    period: "/month",
    features: ["500 checks included", "Everything in Starter", "Priority support", "API access", "Bulk assessments"],
    highlight: true,
  },
  {
    name: "Scale",
    price: "\u20AC799",
    period: "/month",
    features: ["2,000 checks included", "Everything in Growth", "Dedicated account manager", "Custom integrations", "SLA guarantee"],
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4" /> Home
              </Button>
            </Link>
            <span className="font-bold text-slate-900">Pricing</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/terms">
              <Button variant="ghost" size="sm" data-testid="link-terms">Terms</Button>
            </Link>
            <Link href="/partner/login">
              <Button size="sm" className="bg-emerald-900 hover:bg-emerald-800" data-testid="link-portal">
                Partner Portal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-slate-900 mb-3">Credit Risk Assessment Pricing</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            We provide credit risk assessments and decision-support information only.
            Choose the plan that fits your volume.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {plans.map((plan, i) => (
            <Card
              key={i}
              className={`relative ${plan.highlight ? "border-emerald-500 border-2 shadow-lg" : "shadow-sm"}`}
              data-testid={`card-plan-${plan.name.toLowerCase().replace(/[^a-z]/g, '-')}`}
            >
              {plan.highlight && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-display font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500 text-sm ml-1">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a href="mailto:sales@creditchecker.example.com">
                  <Button
                    className={`w-full ${plan.highlight ? "bg-emerald-900 hover:bg-emerald-800" : ""}`}
                    variant={plan.highlight ? "default" : "outline"}
                    data-testid={`button-contact-${plan.name.toLowerCase().replace(/[^a-z]/g, '-')}`}
                  >
                    Contact Sales
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-3xl mx-auto">
          <p className="text-sm text-amber-800 text-center flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            CredBuddy provides data-driven credit risk insights for informational purposes only. CredBuddy does not provide financial advice, credit decisions, or recommendations. Final decisions remain with you.
          </p>
        </div>
      </main>
    </div>
  );
}
