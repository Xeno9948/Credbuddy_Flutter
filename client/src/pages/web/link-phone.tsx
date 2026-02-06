import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, CheckCircle } from "lucide-react";
import { useSendPhoneCode } from "@/lib/webApi";

export default function LinkPhone() {
  const [phone, setPhone] = useState("+27");
  const [, setLocation] = useLocation();
  const linkPhone = useSendPhoneCode();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    linkPhone.mutate(phone, {
      onSuccess: () => {
        setTimeout(() => setLocation("/web/app"), 1500);
      },
    });
  };

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <Phone className="w-10 h-10 text-emerald-600 mx-auto" />
          <CardTitle className="text-lg font-bold text-emerald-950">
            Link Your Phone
          </CardTitle>
          <p className="text-sm text-slate-600" data-testid="text-link-message">
            Enter your mobile number to link your CredBuddy profile.
          </p>
        </CardHeader>
        <CardContent>
          {linkPhone.isSuccess ? (
            <div className="text-center space-y-3" data-testid="text-link-success">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="text-sm text-slate-700">Phone linked successfully! Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+27..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  data-testid="input-phone"
                />
              </div>
              {linkPhone.isError && (
                <p className="text-sm text-red-600" data-testid="text-phone-error">
                  {linkPhone.error?.message || "Failed to link phone."}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-emerald-900 hover:bg-emerald-800 text-white"
                disabled={linkPhone.isPending}
                data-testid="button-link-phone"
              >
                {linkPhone.isPending ? "Linking..." : "Link Phone"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
