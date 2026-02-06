import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4" /> Home
              </Button>
            </Link>
            <span className="font-bold text-slate-900">Terms & Disclaimers</span>
          </div>
          <Link href="/pricing">
            <Button variant="ghost" size="sm" data-testid="link-pricing">Pricing</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8 flex items-start gap-3">
          <Shield className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-bold text-amber-900 mb-1">Important Notice</h2>
            <p className="text-amber-800">
              CredBuddy provides data-driven credit risk insights for informational purposes only.
              CredBuddy does not provide financial advice, credit decisions, or recommendations.
              The final decision remains entirely with the user or authorized partner.
            </p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-8 prose prose-slate max-w-none">
            <h1 className="text-2xl font-display font-bold text-slate-900 mb-6">Terms of Service</h1>

            <h2 className="text-lg font-semibold mt-8 mb-3">1. Service Description</h2>
            <p>
              The AI Credit & Cashflow Assistant ("the Service") provides credit risk assessments
              and decision-support information based on self-reported financial data from micro-entrepreneurs.
              The Service generates credit scores, risk indicators, and explainable summaries for use by
              authorized risk partners.
            </p>

            <h2 className="text-lg font-semibold mt-8 mb-3">2. Data Tool Positioning</h2>
            <p>
              The Service is a data and insight tool. It does NOT:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide financial advice or recommendations</li>
              <li>Make credit decisions of any kind</li>
              <li>Guarantee any financial outcome</li>
              <li>Act as a financial advisor or intermediary</li>
            </ul>
            <p className="mt-2">
              All credit risk insights are for decision-support and informational purposes only. Final decisions
              remain entirely with the user or authorized partner.
            </p>

            <h2 className="text-lg font-semibold mt-8 mb-3">3. Data & Scoring</h2>
            <p>
              Credit Score v1 is experimental and based on self-reported cashflow data submitted via
              the WhatsApp interface. The score (0-1000) is computed using six behavioral features
              over a 14-day lookback window. Scores are NOT equivalent to traditional credit bureau
              scores and are intended to be treated as supplementary information.
            </p>

            <h2 className="text-lg font-semibold mt-8 mb-3">4. Accuracy & Limitations</h2>
            <p>
              While we employ rigorous algorithms and explainable AI techniques, the Service:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Relies on self-reported data which may be inaccurate or incomplete</li>
              <li>Uses a 14-day rolling window which may not capture long-term trends</li>
              <li>Cannot verify the authenticity of submitted financial data</li>
              <li>May produce scores that differ from traditional credit assessments</li>
            </ul>

            <h2 className="text-lg font-semibold mt-8 mb-3">5. Partner Responsibilities</h2>
            <p>
              Authorized partners accessing this Service acknowledge:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use assessments as one input among many in their credit decisions</li>
              <li>Maintain their own independent underwriting processes</li>
              <li>Not rely solely on our data for any decisions</li>
              <li>Comply with all applicable regulations in their jurisdiction</li>
              <li>Protect the confidentiality of shared reports and data</li>
            </ul>

            <h2 className="text-lg font-semibold mt-8 mb-3">6. Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, the Service provider shall not be liable
              for any direct, indirect, incidental, special, consequential, or punitive damages arising
              from the use of credit risk assessments, scores, or reports generated by the Service.
              This includes but is not limited to losses arising from credit decisions made using
              information provided by the Service.
            </p>

            <h2 className="text-lg font-semibold mt-8 mb-3">7. Data Privacy</h2>
            <p>
              Personal information is processed in accordance with applicable data protection laws,
              including the Protection of Personal Information Act (POPIA) in South Africa. Phone
              numbers are masked in shared reports and PDF exports to protect entrepreneur privacy.
            </p>

            <h2 className="text-lg font-semibold mt-8 mb-3">8. Shared Reports</h2>
            <p>
              Secure shared links expire after 7 days from creation. All link creation and view events
              are logged for audit purposes. Recipients of shared reports are bound by the same
              terms regarding data use and limitations.
            </p>

            <div className="mt-12 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Last updated: {new Date().toLocaleDateString("en-ZA")}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-8">
          <p className="text-sm text-amber-800 text-center">
            <strong>Disclaimer:</strong> This report is for decision-support purposes only. It does not constitute
            financial advice, a credit decision, or a guarantee of any outcome. Score v1 is experimental
            and based on self-reported cashflow data. Final decisions remain with you.
          </p>
        </div>
      </main>
    </div>
  );
}
