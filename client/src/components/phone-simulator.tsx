import { cn } from "@/lib/utils";
import React from "react";

interface PhoneSimulatorProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PhoneSimulator({ children, className, ...props }: PhoneSimulatorProps) {
  return (
    <div className={cn("relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[800px] w-[375px] shadow-xl overflow-hidden", className)} {...props}>
      {/* Notch / Dynamic Island */}
      <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 z-50 flex justify-center">
        <div className="h-4 w-32 bg-black rounded-b-xl"></div>
      </div>
      
      {/* Screen Content */}
      <div className="w-full h-full bg-[#E5DDD5] dark:bg-[#0b141a] overflow-hidden relative flex flex-col pt-6">
         {/* WhatsApp Header Mock */}
         <div className="bg-[#008069] dark:bg-[#1f2c34] px-4 py-3 flex items-center gap-3 text-white shadow-sm z-10 shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
              AI
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Credit Assistant</h3>
              <p className="text-[10px] opacity-80">Business Account</p>
            </div>
            <div className="flex gap-4 opacity-70">
              <div className="w-4 h-4 bg-current rounded-full opacity-0" /> {/* Spacer */}
            </div>
         </div>

         {/* Chat Area */}
         <div className="flex-1 overflow-hidden relative">
            {children}
         </div>
      </div>
      
      {/* Home Indicator */}
      <div className="absolute bottom-1 inset-x-0 flex justify-center z-50 pointer-events-none">
        <div className="w-32 h-1 bg-gray-100/20 rounded-full"></div>
      </div>
    </div>
  );
}
