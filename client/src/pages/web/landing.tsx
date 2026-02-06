import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function WebLanding() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex flex-col items-center gap-3">
            <img
              src="/credbuddy-logo.png"
              alt="CredBuddy"
              className="w-16 h-16"
              data-testid="img-logo"
            />
            <h1
              className="text-2xl font-bold text-emerald-950"
              data-testid="text-heading"
            >
              CredBuddy Web Lite
            </h1>
          </div>
          <p className="text-sm text-slate-600" data-testid="text-description">
            View your credit score, track daily revenue, and manage your
            financial data — a companion to WhatsApp.
          </p>
          <Link href="/web/login">
            <Button
              className="w-full bg-emerald-900 hover:bg-emerald-800 text-white gap-2"
              data-testid="button-login"
            >
              <Mail className="w-4 h-4" />
              Login with Email
            </Button>
          </Link>
        </CardContent>
      </Card>
      <p className="mt-6 text-xs text-slate-400" data-testid="text-disclaimer">
        Decision-support only. Final decisions remain with you.
      </p>
    </div>
  );
}
