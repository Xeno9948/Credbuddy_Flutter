import React from "react";
import { Link } from "wouter";
import { AdminDashboard } from "@/components/admin-dashboard";
import { BookOpen, Globe, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 w-full">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <img src="/credbuddy-logo.png" alt="CredBuddy" className="w-8 h-8 cursor-pointer" />
            </Link>
            <span className="font-display font-semibold text-emerald-900 text-lg hidden sm:inline-block">CredBuddy</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/manual">
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-emerald-900 gap-1 hidden sm:flex">
                <BookOpen className="w-4 h-4" /> Manual
              </Button>
            </Link>
            <Link href="/web">
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-emerald-900 gap-1">
                <Globe className="w-4 h-4" /> Web Lite
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-emerald-700">
                <LogOut className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto py-8 px-4">
        <AdminDashboard />
      </main>
    </div>
  );
}
