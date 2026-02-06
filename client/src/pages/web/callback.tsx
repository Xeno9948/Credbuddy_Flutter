import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { useVerifyToken } from "@/lib/webApi";

export default function WebCallback() {
  const [, setLocation] = useLocation();
  const verify = useVerifyToken();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setError("No token provided.");
      return;
    }
    verify.mutate(token, {
      onSuccess: () => setLocation("/web/app"),
      onError: (err) => setError(err.message || "Verification failed."),
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8 text-center space-y-4">
          {error ? (
            <>
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-sm text-red-600" data-testid="text-error">{error}</p>
              <Link href="/web/login">
                <Button
                  variant="outline"
                  className="gap-1"
                  data-testid="link-back-login"
                >
                  Back to Login
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
              <p className="text-sm text-slate-600" data-testid="text-loading">
                Verifying your login…
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
