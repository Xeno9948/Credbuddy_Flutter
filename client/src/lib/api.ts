import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";

export interface FeatureBreakdown {
  dd: number;
  rs: number;
  ep: number;
  bb: number;
  tm: number;
  sr: number;
}

export interface ScoreData {
  id: number;
  score: number;
  confidence: number;
  band: "A" | "B" | "C" | "D";
  flags: string[];
  featureBreakdown: FeatureBreakdown;
  asOfDate: string;
  explanations?: { reasons: string[]; tips: string[] };
}

export interface EntryData {
  id: number;
  userId: number;
  date: string;
  revenueCents: number;
  expenseCents: number;
  expenseNote: string | null;
}

export interface UserProfile {
  id: number;
  businessName: string;
  businessType: string;
}

export interface UserFull {
  user: { id: number; phone: string; createdAt: string; lastActiveAt: string };
  profile: UserProfile | null;
  entries: EntryData[];
  score: ScoreData | null;
  scoreHistory?: ScoreData[];
  cashEstimate: { id: number; cashAvailableCents: number; asOfDate: string } | null;
}

export interface UserListItem {
  id: number;
  phone: string;
  createdAt: string;
  lastActiveAt: string;
  profile: UserProfile | null;
  score: { score: number; band: string; confidence: number } | null;
}

export interface DashboardStats {
  userCount: number;
  activeUsers: number;
  avgScore: number;
  bandDist: Record<string, number>;
}

// ─── Seed demo data ─────────────────────────────────────
export function useSeedData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/seed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api"] });
    },
  });
}

// ─── Get/create user by phone ───────────────────────────
export function useGetOrCreateUser(phone: string) {
  return useQuery<UserFull>({
    queryKey: ["/api/users/phone", phone],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/users", { phone });
      return res.json();
    },
    enabled: !!phone,
  });
}

// ─── Get user detail ────────────────────────────────────
export function useUserDetail(userId: number | null) {
  return useQuery<UserFull>({
    queryKey: ["/api/users", String(userId)],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error("Failed to load user");
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 3000,
  });
}

// ─── List users ─────────────────────────────────────────
export function useUserList() {
  return useQuery<UserListItem[]>({
    queryKey: ["/api/users"],
    refetchInterval: 5000,
  });
}

// ─── Admin dashboard stats ──────────────────────────────
export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
    refetchInterval: 5000,
  });
}

// ─── Chat mutation ──────────────────────────────────────
export function useSendChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { userId: number; text: string }) => {
      const res = await apiRequest("POST", "/api/chat", data);
      return res.json() as Promise<{ reply: string }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api"] });
    },
  });
}

// ─── Add entry ──────────────────────────────────────────
export function useAddEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { userId: number; date: string; revenueCents: number; expenseCents: number; expenseNote?: string }) => {
      const { userId, ...body } = data;
      const res = await apiRequest("POST", `/api/users/${userId}/entries`, body);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api"] });
    },
  });
}

// ─── Recalculate score ──────────────────────────────────
export function useRecalcScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/users/${userId}/score`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api"] });
    },
  });
}

// ─── Partner login ──────────────────────────────────────
export function usePartnerLogin() {
  return useMutation({
    mutationFn: async (apiKey: string) => {
      const res = await apiRequest("POST", "/api/partner/login", { apiKey });
      return res.json();
    },
  });
}

// ─── Partner search ─────────────────────────────────────
export function usePartnerSearch(apiKey: string, query: string) {
  return useQuery<UserListItem[]>({
    queryKey: ["/api/partner/search", query],
    queryFn: async () => {
      const res = await fetch(`/api/partner/search?q=${encodeURIComponent(query)}`, {
        headers: { "X-API-KEY": apiKey },
      });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: !!apiKey && !!query,
  });
}

// ─── Partner dashboard stats ────────────────────────────
export interface PartnerDashboardStats {
  totalApplicants: number;
  avgScore: number;
  bandDist: Record<string, number>;
  highRisk: number;
  lowRisk: number;
  flaggedApplicants: {
    id: number;
    phone: string;
    businessName: string | null;
    businessType: string | null;
    score: number;
    band: string;
    confidence: number;
    flags: string[];
  }[];
  recentActivity: {
    id: number;
    phone: string;
    businessName: string | null;
    score: number;
    band: string;
    updatedAt: string;
  }[];
}

export function usePartnerDashboard(apiKey: string) {
  return useQuery<PartnerDashboardStats>({
    queryKey: ["/api/partner/dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/partner/dashboard", {
        headers: { "X-API-KEY": apiKey },
      });
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json();
    },
    enabled: !!apiKey,
    refetchInterval: 5000,
  });
}

// ─── Partner applicant detail ───────────────────────────
export interface LenderExplainability {
  headline: string;
  scoreLine: string;
  confidenceLine: string;
  positiveDrivers: string[];
  negativeDrivers: string[];
  flags: string[];
  improvements: string[];
  disclaimer: string;
}

export interface ExplainabilityData {
  lender: LenderExplainability;
  lenderText: string;
  entrepreneurText: string;
  breakdown: any;
  polished: boolean;
}

export function usePartnerApplicant(apiKey: string, userId: number | null) {
  return useQuery<UserFull & { explainability: ExplainabilityData | null }>({
    queryKey: ["/api/partner/applicant", String(userId)],
    queryFn: async () => {
      const res = await fetch(`/api/partner/applicant/${userId}`, {
        headers: { "X-API-KEY": apiKey },
      });
      if (!res.ok) throw new Error("Failed to load applicant");
      return res.json();
    },
    enabled: !!apiKey && !!userId,
  });
}
