import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, CheckCircle } from "lucide-react";
import { useSendPhoneCode, useVerifyPhoneCode } from "@/lib/webApi";

export default function LinkPhone() {
  const [phone, setPhone] = useState("+27");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const sendCode = useSendPhoneCode();
  const verifyCode = useVerifyPhoneCode();

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    sendCode.mutate(phone, {
      onSuccess: () => setCodeSent(true),
    });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCode.mutate({ phone, code });
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
            Link your WhatsApp profile to access your CredBuddy data.
          </p>
        </CardHeader>
        <CardContent>
          {verifyCode.isSuccess ? (
            <div className="text-center space-y-3" data-testid="text-link-success">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="text-sm text-slate-700">Phone linked successfully!</p>
            </div>
          ) : !codeSent ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (E.164)</Label>
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
              {sendCode.isError && (
                <p className="text-sm text-red-600" data-testid="text-phone-error">
                  {sendCode.error?.message || "Failed to send code."}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-emerald-900 hover:bg-emerald-800 text-white"
                disabled={sendCode.isPending}
                data-testid="button-send-code"
              >
                {sendCode.isPending ? "Sending..." : "Send Code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-slate-600 text-center">
                A 6-digit code was sent to <strong>{phone}</strong>.
              </p>
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  data-testid="input-code"
                />
              </div>
              {verifyCode.isError && (
                <p className="text-sm text-red-600" data-testid="text-verify-error">
                  {verifyCode.error?.message || "Invalid code. Please try again."}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-emerald-900 hover:bg-emerald-800 text-white"
                disabled={verifyCode.isPending}
                data-testid="button-verify"
              >
                {verifyCode.isPending ? "Verifying..." : "Verify"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
