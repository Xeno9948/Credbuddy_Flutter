import React, { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, User, Bot, Loader2 } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function EmbeddedAIChat({ className }: { className?: string }) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hello! I'm ready to analyze your financial data. Ask me anything about your revenue, expenses, or credit score trends.",
        },
    ]);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const chatMutation = useMutation({
        mutationFn: async (message: string) => {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    history: messages.slice(1), // Exclude initial greeting
                }),
            });
            if (!res.ok) throw new Error("Failed to send message");
            const data = await res.json();
            return data.response;
        },
        onSuccess: (response) => {
            setMessages((prev) => [...prev, { role: "assistant", content: response }]);
        },
        onError: () => {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "I encountered an error processing your request. Please try again." },
            ]);
        },
    });

    const handleSend = () => {
        if (!input.trim() || chatMutation.isPending) return;
        const userMessage = input.trim();
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setInput("");
        chatMutation.mutate(userMessage);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    useEffect(() => {
        const handleConsult = (e: CustomEvent<string>) => {
            setInput(e.detail);
            // Optional: highlight the input or auto-send.
            // Let's auto-focus and scroll to view
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        };

        window.addEventListener('ai-consult' as any, handleConsult as any);
        return () => window.removeEventListener('ai-consult' as any, handleConsult as any);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, chatMutation.isPending]);

    return (
        <Card className={`flex flex-col h-[500px] border-emerald-100 shadow-sm ${className}`}>
            <CardHeader className="bg-emerald-50/50 pb-3 border-b border-emerald-100/50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold text-emerald-950">AI Command Center</CardTitle>
                        <CardDescription className="text-xs text-emerald-800/60">
                            Data-driven analysis & insights
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-white">
                <ScrollArea ref={scrollRef} className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-slate-100" : "bg-emerald-50"
                                    }`}>
                                    {msg.role === "user" ? (
                                        <User className="w-4 h-4 text-slate-500" />
                                    ) : (
                                        <Bot className="w-4 h-4 text-emerald-600" />
                                    )}
                                </div>
                                <div
                                    className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed shadow-sm ${msg.role === "user"
                                        ? "bg-slate-800 text-white rounded-tr-none"
                                        : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}

                        {chatMutation.isPending && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                                    <span className="text-xs text-slate-400">Analyzing data...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex gap-2 relative">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask for analysis, trends, or help..."
                            className="pr-12 bg-white border-slate-200 focus-visible:ring-emerald-500"
                            disabled={chatMutation.isPending}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || chatMutation.isPending}
                            size="icon"
                            className="absolute right-1 top-1 h-8 w-8 bg-emerald-900 hover:bg-emerald-800 rounded-lg"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {["Analyze my cashflow", "Explain my credit score", "Suggest improvements"].map((suggestion) => (
                            <button
                                key={suggestion}
                                onClick={() => {
                                    setInput(suggestion);
                                    // Optional: auto-send
                                }}
                                className="text-xs px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 transition-colors whitespace-nowrap"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
