import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Home, PlusCircle, List, BarChart3, FileText } from "lucide-react";
import { useWebMe, useWebLogout } from "@/lib/webApi";
import LinkPhone from "./link-phone";

const NAV_ITEMS = [
  { label: "Home", href: "/web/app", icon: Home },
  { label: "Add Today", href: "/web/app/add", icon: PlusCircle },
  { label: "Entries", href: "/web/app/entries", icon: List },
  { label: "History", href: "/web/app/history", icon: BarChart3 },
  { label: "Report", href: "/web/app/report", icon: FileText },
];

export function WebAppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: me, isLoading, isError } = useWebMe();
  const logout = useWebLogout();

  useEffect(() => {
    if (!isLoading && isError) {
      setLocation("/web/login");
    }
  }, [isLoading, isError]);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => setLocation("/web/login"),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (isError || !me) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-emerald-950 text-white border-b border-emerald-900 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/credbuddy-logo.png" alt="CredBuddy" className="w-7 h-7" />
            <span className="font-semibold text-sm tracking-tight">CredBuddy</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-emerald-300 hidden sm:inline" data-testid="text-email">
              {me.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-emerald-300 hover:text-white hover:bg-emerald-900 gap-1"
              disabled={logout.isPending}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 flex overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {me.linkedUserId === null ? <LinkPhone /> : children}
      </main>

      <footer className="border-t bg-white py-3">
        <p className="text-center text-xs text-slate-400" data-testid="text-disclaimer">
          Decision-support only. Final decisions remain with you.
        </p>
      </footer>
    </div>
  );
}
