import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Smartphone, ArrowRight } from "lucide-react";

export default function PortalSelection() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <img src="/credbuddy-logo.png" alt="CredBuddy" className="w-20 h-20" />
                    </div>
                    <h1 className="text-4xl font-display font-bold text-emerald-950 tracking-tight">
                        Welcome to CredBuddy
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Select your portal to continue. Manage your credit health or access partner tools.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Subscriber Portal */}
                    <Link href="/web/login">
                        <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-emerald-500/20 bg-white/50 backdrop-blur-sm">
                            <CardHeader className="text-center pb-2">
                                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <Smartphone className="w-8 h-8 text-emerald-600" />
                                </div>
                                <CardTitle className="text-2xl font-bold text-emerald-900">Subscriber Portal</CardTitle>
                                <CardDescription className="text-base">
                                    For business owners and individuals
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-center space-y-4">
                                <p className="text-slate-500">
                                    View your credit score, track daily revenue, and manage your financial health.
                                </p>
                                <Button className="w-full bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl h-12 text-base group-hover:shadow-lg transition-all">
                                    Login with Email <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Partner Portal */}
                    <Link href="/partner/login">
                        <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-blue-500/20 bg-white/50 backdrop-blur-sm">
                            <CardHeader className="text-center pb-2">
                                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                                </div>
                                <CardTitle className="text-2xl font-bold text-slate-900">Partner Portal</CardTitle>
                                <CardDescription className="text-base">
                                    For lenders and risk managers
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-center space-y-4">
                                <p className="text-slate-500">
                                    Access risk assessments, view applicant scores, and manage your portfolio.
                                </p>
                                <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 rounded-xl h-12 text-base group-hover:shadow-lg transition-all">
                                    Partner Login <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                <div className="text-center pt-8">
                    <p className="text-sm text-slate-400">
                        &copy; {new Date().getFullYear()} CredBuddy. Secure Financial Technology.
                    </p>
                </div>
            </div>
        </div>
    );
}
