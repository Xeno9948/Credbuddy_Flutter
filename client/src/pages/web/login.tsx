import React, { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useRequestMagicLink } from "@/lib/webApi";

export default function WebLogin() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [magicUrl, setMagicUrl] = useState<string | null>(null);
  const mutation = useRequestMagicLink();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(email, {
      onSuccess: (data: any) => {
        setSent(true);
        if (data.magicUrl) setMagicUrl(data.magicUrl);
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <img src="/credbuddy-logo.png" alt="CredBuddy" className="w-12 h-12" />
          </div>
          <CardTitle className="text-xl font-bold text-emerald-950">
            Sign in to CredBuddy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4" data-testid="text-success">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="text-sm text-slate-700">
                A login link has been created for <strong>{email}</strong>.
              </p>
              {magicUrl && (
                <a
                  href={magicUrl}
                  className="inline-block w-full px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-md text-sm font-medium"
                  data-testid="link-magic"
                >
                  Click here to sign in
                </a>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>
              {mutation.isError && (
                <p className="text-sm text-red-600" data-testid="text-error">
                  {mutation.error?.message || "Something went wrong. Please try again later."}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-emerald-900 hover:bg-emerald-800 text-white gap-2"
                disabled={mutation.isPending}
                data-testid="button-send-link"
              >
                <Mail className="w-4 h-4" />
                {mutation.isPending ? "Sending..." : "Send Login Link"}
              </Button>
            </form>
          )}
          <div className="mt-4 text-center">
            <Link href="/web">
              <Button variant="ghost" size="sm" className="text-slate-500 gap-1" data-testid="link-back">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      <p className="mt-6 text-xs text-slate-400" data-testid="text-disclaimer">
        Decision-support only. Final decisions remain with you.
      </p>
    </div>
  );
}
