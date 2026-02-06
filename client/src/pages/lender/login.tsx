import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock } from "lucide-react";
import { usePartnerLogin } from "@/lib/api";

export default function LenderLogin() {
  const [, setLocation] = useLocation();
  const [apiKey, setApiKey] = useState("pk_demo_nedbank_key_12345");
  const [error, setError] = useState("");
  const loginMutation = usePartnerLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate(apiKey, {
      onSuccess: (data) => {
        sessionStorage.setItem("partnerApiKey", apiKey);
        sessionStorage.setItem("partnerName", data.partner.name);
        setLocation("/partner");
      },
      onError: () => {
        setError("Invalid API key. Please check your credentials.");
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-emerald-900 rounded-lg flex items-center justify-center">
               <ShieldCheck className="text-emerald-400 w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display font-bold text-emerald-950">Partner Portal</CardTitle>
          <CardDescription>
            Authorized Lenders & Risk Partners Only
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="pk_..."
                  data-testid="input-api-key"
                />
                <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>
            {error && <p className="text-sm text-red-600" data-testid="text-login-error">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-emerald-900 hover:bg-emerald-800 text-white"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? "Authenticating..." : "Access Portal"}
            </Button>
            <div className="text-center text-xs text-slate-500 mt-4">
              Access is monitored and audited.
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
