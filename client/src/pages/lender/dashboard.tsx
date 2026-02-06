import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, User, FileText, ArrowRight, Bell, Plus, Loader2 } from "lucide-react";
import { useUserList } from "@/lib/api";

export default function LenderDashboard() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const { data: users, isLoading } = useUserList();

  useEffect(() => {
    const apiKey = sessionStorage.getItem("partnerApiKey");
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-emerald-950 text-white border-b border-emerald-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-emerald-800 rounded flex items-center justify-center font-bold font-display">
               L
             </div>
             <span className="font-semibold text-lg tracking-tight">LenderPortal</span>
           </div>
           <div className="flex items-center gap-4">
             <span className="text-sm text-emerald-300" data-testid="text-partner-name">{partnerName}</span>
             <Button variant="ghost" size="icon" className="text-emerald-100 hover:text-white hover:bg-emerald-900">
               <Bell className="w-5 h-5" />
             </Button>
             <div className="h-8 w-8 rounded-full bg-emerald-800 flex items-center justify-center text-xs">
               {partnerName.substring(0, 2).toUpperCase()}
             </div>
           </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        <div className="max-w-2xl mx-auto text-center space-y-6 py-8">
           <h1 className="text-3xl font-display font-bold text-slate-900" data-testid="text-lender-title">Find an Applicant</h1>
           <p className="text-slate-500">Search by Business Name, Owner ID, or Phone Number</p>
           
           <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
             <Input 
               className="pl-12 h-12 text-lg shadow-sm border-slate-300" 
               placeholder="e.g. 072 123 4567 or Thabo" 
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               data-testid="input-search-applicant"
             />
             <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
             <Button type="submit" className="absolute right-1 top-1 h-10 bg-emerald-900 hover:bg-emerald-800" data-testid="button-search">
               Search
             </Button>
           </form>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              {query ? "Search Results" : "All Applicants"}
            </h2>
          </div>
          
          {isLoading ? (
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
                           <Badge variant={app.score.band === 'A' ? 'default' : app.score.band === 'B' ? 'secondary' : 'destructive'}>
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
               
              {filteredApplicants.length === 0 && !isLoading && (
                <div className="col-span-3 text-center py-12 text-slate-400">
                  No applicants found. {query ? "Try a different search." : "Seed demo data from the main dashboard."}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Card className="bg-emerald-50 border-emerald-100">
             <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700">
                   <FileText className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-semibold text-emerald-900">Batch Upload</h3>
                   <p className="text-sm text-emerald-700/80">Upload CSV for bulk scoring</p>
                </div>
             </CardContent>
           </Card>
           <Card className="bg-blue-50 border-blue-100">
             <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
                   <User className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-semibold text-blue-900">API Documentation</h3>
                   <p className="text-sm text-blue-700/80">Integrate scoring into your LOS</p>
                </div>
             </CardContent>
           </Card>
        </div>

      </main>
    </div>
  );
}
