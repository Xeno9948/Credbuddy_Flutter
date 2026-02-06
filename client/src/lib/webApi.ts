import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function webFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface WebMe {
  email: string;
  linkedUserId: number | null;
  linkedPhone: string | null;
  businessName: string | null;
  businessType: string | null;
}

export interface WebScore {
  score: number;
  band: string;
  confidence: number;
  flags: string[];
  featureBreakdown: Record<string, number>;
  asOfDate: string;
}

export interface WebEntry {
  id: number;
  date: string;
  revenueCents: number;
  expenseCents: number;
  expenseNote: string | null;
}

export interface WebHistoryItem {
  id: number;
  asOfDate: string;
  score: number;
  band: string;
  confidence: number;
  flags: string[];
}

export function useWebMe() {
  return useQuery<WebMe>({
    queryKey: ["web-me"],
    queryFn: () => webFetch("/api/web/auth/me"),
    retry: false,
  });
}

export function useWebScore() {
  return useQuery<{ score: WebScore | null; businessName: string | null }>({
    queryKey: ["web-score"],
    queryFn: () => webFetch("/api/web/score"),
    retry: false,
  });
}

export function useWebEntries(days: number = 30) {
  return useQuery<WebEntry[]>({
    queryKey: ["web-entries", days],
    queryFn: () => webFetch(`/api/web/entries?days=${days}`),
    retry: false,
  });
}

export function useWebHistory(days: number = 30) {
  return useQuery<WebHistoryItem[]>({
    queryKey: ["web-history", days],
    queryFn: () => webFetch(`/api/web/history?days=${days}`),
    retry: false,
  });
}

export function useWebReportStatus() {
  return useQuery<{ available: boolean }>({
    queryKey: ["web-report-status"],
    queryFn: () => webFetch("/api/web/report-status"),
    retry: false,
  });
}

export function useRequestMagicLink() {
  return useMutation({
    mutationFn: (email: string) =>
      webFetch("/api/web/auth/request-link", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
  });
}

export function useVerifyToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      webFetch("/api/web/auth/verify-token", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["web-me"] }),
  });
}

export function useWebLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      webFetch("/api/web/auth/logout", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["web-me"] }),
  });
}

export function useSendPhoneCode() {
  return useMutation({
    mutationFn: (phone: string) =>
      webFetch("/api/web/phone/send-code", {
        method: "POST",
        body: JSON.stringify({ phone }),
      }),
  });
}

export function useVerifyPhoneCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { phone: string; code: string }) =>
      webFetch("/api/web/phone/verify-code", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["web-me"] }),
  });
}

export function useCreateWebEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { revenueCents: number; expenseCents?: number; expenseNote?: string }) =>
      webFetch("/api/web/entries", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["web-entries"] });
      qc.invalidateQueries({ queryKey: ["web-score"] });
    },
  });
}

export function useWebRecalc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      webFetch("/api/web/recalc", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["web-score"] });
      qc.invalidateQueries({ queryKey: ["web-history"] });
    },
  });
}
