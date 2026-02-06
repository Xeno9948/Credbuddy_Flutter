import React from "react";
import { Link } from "wouter";
import { PhoneSimulator } from "@/components/phone-simulator";
import { ChatInterface } from "@/components/chat-interface";
import { AdminDashboard } from "@/components/admin-dashboard";
import { BookOpen, Shield } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row overflow-hidden">
      
      {/* Left Panel: Simulation (Phone) */}
      <div className="w-full lg:w-[450px] bg-slate-200 border-r border-slate-300 flex flex-col items-center justify-center p-8 shrink-0 relative overflow-y-auto">
         <div className="absolute top-4 left-4 flex items-center gap-2">
            <img src="/credbuddy-logo.png" alt="CredBuddy" className="w-8 h-8" />
            <span className="text-sm font-display font-semibold text-emerald-900">CredBuddy</span>
         </div>
         <div className="absolute top-3 right-3 flex gap-2">
           <Link href="/manual">
             <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 bg-white/80 rounded-full px-3 py-1.5 shadow-sm transition-colors" data-testid="link-manual">
               <BookOpen className="w-3 h-3" /> Manual
             </button>
           </Link>
           <Link href="/partner/login">
             <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 bg-white/80 rounded-full px-3 py-1.5 shadow-sm transition-colors" data-testid="link-partner">
               <Shield className="w-3 h-3" /> Partner Portal
             </button>
           </Link>
         </div>
         <div className="scale-90 lg:scale-100 transform transition-transform">
           <PhoneSimulator>
             <ChatInterface />
           </PhoneSimulator>
         </div>
         <p className="mt-8 text-sm text-slate-500 text-center max-w-xs">
           Interact with the WhatsApp bot here. The admin dashboard on the right updates in real-time.
         </p>
      </div>

      {/* Right Panel: Admin Dashboard */}
      <div className="flex-1 overflow-y-auto h-screen">
         <div className="max-w-6xl mx-auto w-full">
            <AdminDashboard />
         </div>
      </div>

    </div>
  );
}
