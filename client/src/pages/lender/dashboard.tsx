import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, User, ArrowRight, Bell, Loader2, ShieldAlert,
  TrendingUp, Users, BarChart3, AlertTriangle, Activity, LogOut
} from "lucide-react";
import { useUserList, usePartnerDashboard } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

const BAND_COLORS: Record<string, string> = {
  A: "#10b981",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#ef4444",
};

const BAND_BG: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-amber-100 text-amber-800",
  D: "bg-red-100 text-red-800",
};

export default function LenderDashboard() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const apiKey = sessionStorage.getItem("partnerApiKey") || "";
  const { data: users, isLoading: usersLoading } = useUserList();
  const { data: stats, isLoading: statsLoading } = usePartnerDashboard(apiKey);

  useEffect(() => {
    if (!apiKey) {
      setLocation("/partner/login");
    }
  }, []);

  const partnerName = sessionStorage.getItem("partnerName") || "Partner";

  const filteredApplicants = (users || []).filter((u) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      u.phone.includes(q) ||
      u.profile?.businessName?.toLowerCase().includes(q) ||
      false
    );
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredApplicants.length === 1) {
      setLocation(`/partner/applicant/${filteredApplicants[0].id}`);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("partnerApiKey");
    sessionStorage.removeItem("partnerName");
    setLocation("/partner/login");
  };

  const bandChartData = stats ? [
    { band: "A (Lower Risk)", count: stats.bandDist.A || 0, color: BAND_COLORS.A },
    { band: "B (Moderate)", count: stats.bandDist.B || 0, color: BAND_COLORS.B },
    { band: "C (Elevated)", count: stats.bandDist.C || 0, color: BAND_COLORS.C },
    { band: "D (Higher Risk)", count: stats.bandDist.D || 0, color: BAND_COLORS.D },
  ] : [];

  const riskPieData = stats ? [
    { name: "Lower Risk (A/B)", value: stats.lowRisk, fill: "#10b981" },
    { name: "Higher Risk (C/D)", value: stats.highRisk, fill: "#ef4444" },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-emerald-950 text-white border-b border-emerald-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-emerald-800 rounded flex items-center justify-center font-bold font-display">
               L
             </div>
             <span className="font-semibold text-lg tracking-tight">Risk Manager Portal</span>
           </div>
           <div className="flex items-center gap-4">
             <span className="text-sm text-emerald-300" data-testid="text-partner-name">{partnerName}</span>
             <Button variant="ghost" size="icon" className="text-emerald-100 hover:text-white hover:bg-emerald-900">
               <Bell className="w-5 h-5" />
             </Button>
             <div className="h-8 w-8 rounded-full bg-emerald-800 flex items-center justify-center text-xs">
               {partnerName.substring(0, 2).toUpperCase()}
             </div>
             <Button variant="ghost" size="sm" onClick={handleLogout} className="text-emerald-300 hover:text-white hover:bg-emerald-900 gap-1" data-testid="button-logout">
               <LogOut className="w-4 h-4" /> Logout
             </Button>
           </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {statsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="shadow-sm border-slate-200" data-testid="card-total-applicants">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Total Applicants</p>
                      <h2 className="text-3xl font-display font-bold text-slate-900 mt-1">{stats.totalApplicants}</h2>
                    </div>
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-slate-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200" data-testid="card-avg-score">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Average Score</p>
                      <h2 className="text-3xl font-display font-bold text-slate-900 mt-1">{stats.avgScore}</h2>
                      <p className="text-xs text-slate-400 mt-1">out of 1000</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-emerald-200 bg-emerald-50" data-testid="card-low-risk">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-emerald-700 uppercase tracking-wider font-medium">Lower Risk (A/B)</p>
                      <h2 className="text-3xl font-display font-bold text-emerald-900 mt-1">{stats.lowRisk}</h2>
                      <p className="text-xs text-emerald-600 mt-1">applicants</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-emerald-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-red-200 bg-red-50" data-testid="card-high-risk">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-red-700 uppercase tracking-wider font-medium">Higher Risk (C/D)</p>
                      <h2 className="text-3xl font-display font-bold text-red-900 mt-1">{stats.highRisk}</h2>
                      <p className="text-xs text-red-600 mt-1">applicants</p>
                    </div>
                    <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                      <ShieldAlert className="w-6 h-6 text-red-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-slate-500" />
                    Risk Band Distribution
                  </CardTitle>
                  <CardDescription>Applicants grouped by credit risk band</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bandChartData} barSize={48}>
                      <XAxis dataKey="band" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {bandChartData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-slate-500" />
                    Risk Overview
                  </CardTitle>
                  <CardDescription>Low risk vs high risk proportion</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] flex items-center justify-center">
                  {(stats.lowRisk + stats.highRisk) > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {riskPieData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-slate-400 text-sm">No scored applicants yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {stats.flaggedApplicants.length > 0 && (
              <Card className="shadow-sm border-amber-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="w-5 h-5" />
                    Alerts — Flagged Applicants
                  </CardTitle>
                  <CardDescription>Applicants with risk flags or C/D band scores requiring review</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.flaggedApplicants.map((app) => (
                      <Link key={app.id} href={`/partner/applicant/${app.id}`}>
                        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors cursor-pointer group" data-testid={`card-flagged-${app.id}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${BAND_BG[app.band] || BAND_BG.D}`}>
                              {app.band}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">{app.businessName ?? app.phone}</p>
                              <p className="text-xs text-slate-500">Score: {app.score}/1000 · Confidence: {app.confidence}%</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {app.flags.length > 0 && (
                              <Badge variant="outline" className="text-amber-700 border-amber-300 text-xs">
                                {app.flags.length} flag{app.flags.length > 1 ? "s" : ""}
                              </Badge>
                            )}
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-slate-500" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest score updates across all applicants</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentActivity.length > 0 ? (
                  <div className="space-y-2">
                    {stats.recentActivity.map((act) => (
                      <Link key={act.id} href={`/partner/applicant/${act.id}`}>
                        <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group" data-testid={`card-activity-${act.id}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${BAND_BG[act.band] || BAND_BG.D}`}>
                              {act.band}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">{act.businessName ?? act.phone}</p>
                              <p className="text-xs text-slate-400">
                                Updated {new Date(act.updatedAt).toLocaleDateString()} at {new Date(act.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-display font-bold text-slate-900">{act.score}</span>
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-6">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400" />
            {query ? "Search Results" : "All Applicants"}
          </h2>
          
          <form onSubmit={handleSearch} className="relative max-w-lg mb-6">
            <Input 
              className="pl-12 h-12 text-base shadow-sm border-slate-300" 
              placeholder="Search by name or phone, e.g. 072 123 4567 or Thabo" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-testid="input-search-applicant"
            />
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <Button type="submit" className="absolute right-1 top-1 h-10 bg-emerald-900 hover:bg-emerald-800" data-testid="button-search">
              Search
            </Button>
          </form>

          {usersLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredApplicants.map((app) => (
                <Link key={app.id} href={`/partner/applicant/${app.id}`}>
                  <Card className="hover:shadow-md transition-all cursor-pointer border-slate-200 group" data-testid={`card-applicant-${app.id}`}>
                    <CardContent className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                         <div>
                           <h3 className="font-semibold text-slate-900 group-hover:text-emerald-800 transition-colors">
                             {app.profile?.businessName ?? "New Applicant"}
                           </h3>
                           <p className="text-sm text-slate-500">{app.phone}</p>
                         </div>
                         {app.score && (
                           <Badge className={BAND_BG[app.score.band] || BAND_BG.D}>
                             Band {app.score.band}
                           </Badge>
                         )}
                      </div>
                      
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-xs text-slate-400 uppercase tracking-wider">Score</span>
                          <div className="text-2xl font-display font-bold text-slate-900">{app.score?.score ?? "N/A"}</div>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          View Profile <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
               
              {filteredApplicants.length === 0 && !usersLoading && (
                <div className="col-span-3 text-center py-12 text-slate-400">
                  No applicants found. {query ? "Try a different search." : "Seed demo data from the main dashboard."}
                </div>
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
