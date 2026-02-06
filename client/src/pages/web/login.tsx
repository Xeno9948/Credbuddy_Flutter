import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { useRequestMagicLink, useVerifyToken } from "@/lib/webApi";

export default function WebLogin() {
  const [email, setEmail] = useState("");
  const [, setLocation] = useLocation();
  const mutation = useRequestMagicLink();
  const verify = useVerifyToken();
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(email, {
      onSuccess: (data: any) => {
        if (data.token) {
          setVerifying(true);
          verify.mutate(data.token, {
            onSuccess: () => setLocation("/web/app"),
            onError: () => setVerifying(false),
          });
        }
      },
    });
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
            <p className="text-sm text-slate-600">Signing you in...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              {(mutation.isError || verify.isError) && (
                <p className="text-sm text-red-600" data-testid="text-error">
                  {mutation.error?.message || verify.error?.message || "Something went wrong. Please try again later."}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-emerald-900 hover:bg-emerald-800 text-white gap-2"
                disabled={mutation.isPending}
                data-testid="button-send-link"
              >
                <Mail className="w-4 h-4" />
                {mutation.isPending ? "Signing in..." : "Sign in with Email"}
              </Button>
            </form>
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
