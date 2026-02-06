import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock } from "lucide-react";

export default function LenderLogin() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setLocation("/partner");
    }, 1000);
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
              <Label htmlFor="email">Partner ID</Label>
              <Input id="email" placeholder="bank-partner-id" defaultValue="nedbank-innovate" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">API Key / Password</Label>
              <div className="relative">
                <Input id="password" type="password" defaultValue="••••••••••••" />
                <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>
            <Button className="w-full bg-emerald-900 hover:bg-emerald-800 text-white" disabled={loading}>
              {loading ? "Authenticating..." : "Access Portal"}
            </Button>
            <div className="text-center text-xs text-slate-500 mt-4">
              Access is monitored and audited. IP: 192.168.1.1
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
