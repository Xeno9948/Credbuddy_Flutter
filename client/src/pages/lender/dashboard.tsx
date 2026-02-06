import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, User, FileText, ArrowRight, Bell, Menu, Plus } from "lucide-react";
import { useAppStore } from "@/lib/mock-store";

export default function LenderDashboard() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const { user } = useAppStore(); 

  // Mock list of recent applicants
  const recentApplicants = [
    { id: "1", name: user.businessName, owner: user.name, score: user.creditScore.score, band: user.creditScore.band, date: "Today" },
    { id: "2", name: "Mama's Bakery", owner: "Grace N.", score: 745, band: "A", date: "Yesterday" },
    { id: "3", name: "Kasi Car Wash", owner: "David M.", score: 580, band: "C", date: "2 days ago" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query) {
       // Mock finding the user by ID or name
       setLocation("/partner/applicant/1");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Nav */}
      <header className="bg-emerald-950 text-white border-b border-emerald-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-emerald-800 rounded flex items-center justify-center font-bold font-display">
               L
             </div>
             <span className="font-semibold text-lg tracking-tight">LenderPortal</span>
           </div>
           <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" className="text-emerald-100 hover:text-white hover:bg-emerald-900">
               <Bell className="w-5 h-5" />
             </Button>
             <div className="h-8 w-8 rounded-full bg-emerald-800 flex items-center justify-center text-xs">
               NP
             </div>
           </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Search Hero */}
        <div className="max-w-2xl mx-auto text-center space-y-6 py-8">
           <h1 className="text-3xl font-display font-bold text-slate-900">Find an Applicant</h1>
           <p className="text-slate-500">Search by Business Name, Owner ID, or Phone Number</p>
           
           <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
             <Input 
               className="pl-12 h-12 text-lg shadow-sm border-slate-300" 
               placeholder="e.g. 072 123 4567 or Thabo" 
               value={query}
               onChange={(e) => setQuery(e.target.value)}
             />
             <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
             <Button type="submit" className="absolute right-1 top-1 h-10 bg-emerald-900 hover:bg-emerald-800">
               Search
             </Button>
           </form>
           
           <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setQuery("072 555 1234")}>
                 Use Demo Phone
              </Button>
           </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Recent Applications</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentApplicants.map((app) => (
              <Link key={app.id} href={`/partner/applicant/${app.id}`}>
                <Card className="hover:shadow-md transition-all cursor-pointer border-slate-200 group">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                       <div>
                         <h3 className="font-semibold text-slate-900 group-hover:text-emerald-800 transition-colors">{app.name}</h3>
                         <p className="text-sm text-slate-500">{app.owner}</p>
                       </div>
                       <Badge variant={app.band === 'A' ? 'default' : app.band === 'B' ? 'secondary' : 'destructive'}>
                         Band {app.band}
                       </Badge>
                    </div>
                    
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Score</span>
                        <div className="text-2xl font-display font-bold text-slate-900">{app.score}</div>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        View Profile <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
             
             {/* New Applicant Card Placeholder */}
             <Card className="border-dashed border-2 border-slate-200 bg-slate-50 flex items-center justify-center hover:border-emerald-300 transition-colors cursor-pointer opacity-70 hover:opacity-100">
                <CardContent className="p-5 flex flex-col items-center gap-2 text-slate-400">
                   <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-1">
                      <Plus className="w-5 h-5" />
                   </div>
                   <span className="text-sm font-medium">Invite New Applicant</span>
                </CardContent>
             </Card>
          </div>
        </div>

        {/* Quick Actions */}
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
