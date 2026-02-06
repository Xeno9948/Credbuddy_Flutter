import React, { useState, useEffect, useRef } from "react";
import { Send, Plus, Camera, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/mock-store";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function ChatInterface() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Sawubona Thabo! 👋\n\nWelcome back to your AI Credit Assistant.\n\nType *STATUS* for your latest cashflow snapshot.\nType *R[amount]* to log today's revenue.",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, addEntry } = useAppStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate Bot Logic
    setTimeout(() => {
      let botResponse = "";
      const lowerInput = userMsg.text.toLowerCase();

      if (lowerInput.includes("status")) {
        const totalRev = user.entries.reduce((a, b) => a + b.revenueCents, 0) / 100;
        botResponse = `📊 *Weekly Status*\n\nRevenue: R${totalRev.toLocaleString()}\nRisk Level: ${user.creditScore.band}\n\nYou are on track! Keep submitting daily to improve your score.`;
      } else if (lowerInput.match(/r\d+/)) {
        const amount = parseInt(lowerInput.replace(/\D/g, ''));
        addEntry({
          date: new Date().toISOString(),
          revenueCents: amount * 100,
          expenseCents: 0
        });
        botResponse = `✅ Recorded R${amount} revenue for today.\n\nAny expenses to add? (e.g. "400 transport")`;
      } else if (lowerInput.includes("scenario") || lowerInput.includes("loan")) {
        botResponse = `🔮 *Scenario Engine*\n\nIf you borrow *R1000* for 3 months:\n• Repayment: ~R380/pm\n• Cashflow Impact: Low Risk\n\n*Disclaimer:* This is an estimate, not an offer.`;
      } else if (lowerInput.includes("help")) {
        botResponse = `🤖 *Commands:*\n\n• *STATUS*: See your cashflow\n• *R500*: Log revenue\n• *SCENARIO*: Test a loan`;
      } else {
        botResponse = "I didn't quite catch that. Try saying *STATUS* or log revenue like *R500*.";
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-[#E5DDD5] dark:bg-[#0b141a] bg-opacity-90">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        <div className="bg-[#FFF5C4] text-xs p-2 rounded-lg text-center shadow-sm text-yellow-900 mx-4 mb-4 border border-yellow-200">
           🔒 Messages are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
        </div>
        
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={cn(
              "max-w-[80%] p-2 px-3 rounded-lg shadow-sm text-sm whitespace-pre-wrap leading-relaxed",
              msg.sender === 'user' 
                ? "ml-auto bg-[#E7FFDB] dark:bg-[#005c4b] text-gray-800 dark:text-white rounded-tr-none" 
                : "mr-auto bg-white dark:bg-[#1f2c34] text-gray-800 dark:text-white rounded-tl-none"
            )}
          >
            {msg.text}
            <div className="text-[10px] text-right opacity-50 mt-1 flex justify-end gap-1">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {msg.sender === 'user' && <span>✓✓</span>}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="bg-white dark:bg-[#1f2c34] p-3 rounded-lg rounded-tl-none w-16 shadow-sm">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-[#F0F2F5] dark:bg-[#1f2c34] p-2 flex items-center gap-2 pb-6">
        <button className="p-2 text-gray-500 hover:bg-black/5 rounded-full">
          <Plus size={24} />
        </button>
        <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-lg flex items-center px-3 py-2 shadow-sm">
          <input
            className="flex-1 bg-transparent border-none outline-none text-sm dark:text-white placeholder:text-gray-400"
            placeholder="Type a message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
        </div>
        {input ? (
           <button onClick={handleSend} className="p-2 bg-[#008069] text-white rounded-full shadow-md hover:bg-[#006d59] transition-colors">
             <Send size={20} className="ml-0.5" />
           </button>
        ) : (
           <button className="p-2 text-gray-500 hover:bg-black/5 rounded-full">
             <Mic size={24} />
           </button>
        )}
      </div>
    </div>
  );
}
