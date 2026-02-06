import React from "react";
import { PhoneSimulator } from "@/components/phone-simulator";
import { ChatInterface } from "@/components/chat-interface";
import { AdminDashboard } from "@/components/admin-dashboard";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row overflow-hidden">
      
      {/* Left Panel: Simulation (Phone) */}
      <div className="w-full lg:w-[450px] bg-slate-200 border-r border-slate-300 flex flex-col items-center justify-center p-8 shrink-0 relative overflow-y-auto">
         <div className="absolute top-4 left-4 text-xs font-mono uppercase text-slate-500 tracking-widest">
            Client Simulation
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
