import { create } from 'zustand';

// Types derived from the user spec
export type BusinessType = 'Retail' | 'Service' | 'Food' | 'Transport';

export interface DailyEntry {
  id: string;
  date: string;
  revenueCents: number;
  expenseCents: number;
  expenseNote?: string;
}

export interface FeatureBreakdown {
  dd: number; // Data Discipline (0-1)
  rs: number; // Revenue Stability (0-1)
  ep: number; // Expense Pressure (0-1)
  bb: number; // Buffer Behavior (0-1)
  tm: number; // Trend Momentum (0-1)
  sr: number; // Shock Recovery (0-1)
}

export interface ScoreSnapshot {
  score: number; // 0-1000
  confidence: number; // 0-1
  band: 'A' | 'B' | 'C' | 'D';
  flags: string[]; // ["R1", "R2"]
  featureBreakdown: FeatureBreakdown;
}

export interface UserState {
  name: string;
  businessName: string;
  businessType: BusinessType;
  entries: DailyEntry[];
  creditScore: ScoreSnapshot;
  onboardingStep: number; // For simulation
  cashAvailableCents?: number;
  cashAvailableDate?: string;
}

interface AppStore {
  user: UserState;
  addEntry: (entry: Omit<DailyEntry, 'id'>) => void;
  updateUser: (data: Partial<UserState>) => void;
  setCashAvailable: (amountCents: number) => void;
  recalculateScore: () => void;
  reset: () => void;
}

const INITIAL_USER: UserState = {
  name: "Thabo",
  businessName: "Thabo's Spaza",
  businessType: "Retail",
  entries: [
    { id: '1', date: new Date(Date.now() - 86400000 * 1).toISOString(), revenueCents: 120000, expenseCents: 40000, expenseNote: 'Stock' },
    { id: '2', date: new Date(Date.now() - 86400000 * 2).toISOString(), revenueCents: 85000, expenseCents: 10000 },
    { id: '3', date: new Date(Date.now() - 86400000 * 3).toISOString(), revenueCents: 150000, expenseCents: 80000, expenseNote: 'Rent partial' },
    { id: '4', date: new Date(Date.now() - 86400000 * 4).toISOString(), revenueCents: 90000, expenseCents: 20000 },
    { id: '5', date: new Date(Date.now() - 86400000 * 5).toISOString(), revenueCents: 110000, expenseCents: 30000 },
    { id: '6', date: new Date(Date.now() - 86400000 * 6).toISOString(), revenueCents: 95000, expenseCents: 15000 },
    { id: '7', date: new Date(Date.now() - 86400000 * 7).toISOString(), revenueCents: 130000, expenseCents: 45000 },
  ],
  creditScore: {
    score: 650,
    confidence: 0.7,
    band: 'B',
    flags: [],
    featureBreakdown: { dd: 0, rs: 0, ep: 0, bb: 0, tm: 0, sr: 0 }
  },
  onboardingStep: 3, // Completed
  cashAvailableCents: 250000,
  cashAvailableDate: new Date().toISOString()
};

// Helper for clamping values
const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

// Helper for standard deviation
const std = (arr: number[], mean: number) => {
  if (arr.length === 0) return 0;
  return Math.sqrt(arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length);
};

export const useAppStore = create<AppStore>((set, get) => ({
  user: INITIAL_USER,
  
  addEntry: (entry) => set((state) => {
    const newEntry = { ...entry, id: Math.random().toString(36).substring(7) };
    const newEntries = [newEntry, ...state.user.entries];
    
    // Trigger recalculation on next tick
    setTimeout(() => get().recalculateScore(), 50);
    
    return {
      user: {
        ...state.user,
        entries: newEntries
      }
    };
  }),

  updateUser: (data) => set((state) => ({
    user: { ...state.user, ...data }
  })),

  setCashAvailable: (amountCents) => set((state) => {
    setTimeout(() => get().recalculateScore(), 50);
    return {
      user: {
         ...state.user,
         cashAvailableCents: amountCents,
         cashAvailableDate: new Date().toISOString()
      }
    }
  }),

  recalculateScore: () => set((state) => {
    const entries = state.user.entries;
    const now = new Date();
    const msPerDay = 86400000;
    const eps = 0.0001;

    // Filter last 14 days
    const last14DaysEntries = entries.filter(e => {
        const diff = now.getTime() - new Date(e.date).getTime();
        return diff >= 0 && diff <= 14 * msPerDay;
    });

    if (last14DaysEntries.length === 0) return state; // No data, no change

    // --- F1: Data Discipline (DD) ---
    // submission_rate = (# days with at least one DailyEntry in last 14) / 14
    // We need unique days
    const uniqueDays = new Set(last14DaysEntries.map(e => e.date.split('T')[0]));
    const submission_rate = uniqueDays.size / 14;
    let dd = 0;
    if (submission_rate < 0.35) dd = 0.1;
    else if (submission_rate < 0.60) dd = 0.4;
    else if (submission_rate < 0.80) dd = 0.7;
    else dd = 1.0;

    // --- F2: Revenue Stability (RS) ---
    // cv = std(revenue)/max(mean(revenue), eps)
    const revenues = last14DaysEntries.map(e => e.revenueCents);
    const meanRev = revenues.reduce((a, b) => a + b, 0) / (revenues.length || 1);
    const cv = std(revenues, meanRev) / Math.max(meanRev, eps);
    const rs = 1 - clamp(cv / 1.0, 0, 1);

    // --- F3: Expense Pressure (EP) ---
    // if expense data available for >=7 days
    const expensesWithData = last14DaysEntries.filter(e => e.expenseCents > 0);
    let ep = 0.5;
    let hasExpenses = false;
    
    if (expensesWithData.length >= 7) {
        hasExpenses = true;
        const nets = last14DaysEntries.map(e => e.revenueCents - e.expenseCents);
        const meanNet = nets.reduce((a, b) => a + b, 0) / (nets.length || 1);
        const margin = meanNet / Math.max(meanRev, eps);
        ep = clamp((margin + 0.10) / 0.40, 0, 1);
    }

    // --- F4: Buffer Behavior (BB) ---
    // buffer_days = cashAvailable / max(avg_daily_expense, eps)
    let bb = 0.4;
    let hasBuffer = false;
    let buffer_days = 0;

    const avgDailyExpense = last14DaysEntries.reduce((a, b) => a + b.expenseCents, 0) / (uniqueDays.size || 1);
    
    if (state.user.cashAvailableCents !== undefined) {
        // Check if cash available data is recent (within 7 days as per spec "ask once per week")
        // For MVP mock, we just check if it exists
        hasBuffer = true;
        buffer_days = state.user.cashAvailableCents / Math.max(avgDailyExpense, eps);
        bb = clamp(buffer_days / 7, 0, 1);
    }

    // --- F5: Trend Momentum (TM) ---
    // delta = (mean_rev_last7 - mean_rev_prev7)/max(mean_rev_prev7, eps)
    const last7Entries = entries.filter(e => {
        const diff = now.getTime() - new Date(e.date).getTime();
        return diff <= 7 * msPerDay;
    });
    const prev7Entries = entries.filter(e => {
        const diff = now.getTime() - new Date(e.date).getTime();
        return diff > 7 * msPerDay && diff <= 14 * msPerDay;
    });

    const meanRevLast7 = last7Entries.reduce((a, b) => a + b.revenueCents, 0) / (last7Entries.length || 1);
    const meanRevPrev7 = prev7Entries.reduce((a, b) => a + b.revenueCents, 0) / (prev7Entries.length || 1);
    
    // If no prev7 data, assume neutral or 0 change if we have last7, or just 0.5 default
    let tm = 0.5;
    if (prev7Entries.length > 0) {
        const delta = (meanRevLast7 - meanRevPrev7) / Math.max(meanRevPrev7, eps);
        tm = clamp((delta + 0.10) / 0.30, 0, 1);
    } else if (last7Entries.length > 0) {
        tm = 0.6; // Slight bonus for having recent data even if no history
    }

    // --- F6: Shock Recovery (SR) ---
    // Define dip day: revenue < 0.5*mean_rev_14
    const meanRev14 = meanRev; // Already calculated
    let dipDaysCount = 0;
    let totalRecoveryDays = 0;
    
    // Sort chronological for this calc
    const sorted14 = [...last14DaysEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    for (let i = 0; i < sorted14.length; i++) {
        if (sorted14[i].revenueCents < 0.5 * meanRev14) {
            dipDaysCount++;
            // Find recovery
            let recoveryDays = 0;
            for (let j = i + 1; j < sorted14.length; j++) {
                if (sorted14[j].revenueCents >= meanRev14) {
                    recoveryDays = j - i;
                    break;
                }
            }
            // If we didn't recover by end of window, penalize max? or just what we have.
            // Spec says "measure days until revenue >= mean_rev_14". If not found, it's technically infinite or remaining days.
            // For MVP let's assume if not recovered, it contributes (14-i) days penalty
            if (recoveryDays === 0 && i < sorted14.length - 1) {
                recoveryDays = sorted14.length - 1 - i; 
            }
            totalRecoveryDays += recoveryDays;
        }
    }

    let sr = 0.8; // Default if no dips
    if (dipDaysCount > 0) {
        const avg_recovery_days = totalRecoveryDays / dipDaysCount;
        sr = 1 - clamp(avg_recovery_days / 7, 0, 1);
    }

    // --- Weighted Score ---
    // 0.20*DD + 0.20*RS + 0.15*EP + 0.20*BB + 0.10*TM + 0.15*SR
    const weighted = (0.20 * dd) + (0.20 * rs) + (0.15 * ep) + (0.20 * bb) + (0.10 * tm) + (0.15 * sr);
    const newScore = Math.round(1000 * weighted);

    // --- FLAGS ---
    const flags: string[] = [];
    if (submission_rate < 0.50) flags.push("R1 Low reliability");
    
    // R2 Sustained deficit: net<0 for >=4 of last 7 days (if expenses present)
    if (hasExpenses) {
        const last7 = last14DaysEntries.filter(e => (now.getTime() - new Date(e.date).getTime()) <= 7 * msPerDay);
        const deficitDays = last7.filter(e => (e.revenueCents - e.expenseCents) < 0).length;
        if (deficitDays >= 4) flags.push("R2 Sustained deficit");
    }

    if (cv > 0.9) flags.push("R3 High volatility");
    
    if (hasBuffer && buffer_days < 2) flags.push("R4 Low buffer");

    // R5 Declining revenue: delta < -0.15 (Using the delta from TM)
    const delta = (meanRevLast7 - meanRevPrev7) / Math.max(meanRevPrev7, eps);
    if (prev7Entries.length > 0 && delta < -0.15) flags.push("R5 Declining revenue");

    // --- CONFIDENCE ---
    // conf = 0.5 + 0.03*data_days + (0.10 if has_expenses else 0) + (0.10 if has_buffer else 0)
    const data_days = uniqueDays.size;
    let conf = 0.5 + (0.03 * data_days) + (hasExpenses ? 0.10 : 0) + (hasBuffer ? 0.10 : 0);
    conf = clamp(conf, 0, 1);

    // --- BANDS ---
    let band: ScoreSnapshot['band'] = 'D';
    if (newScore >= 720 && flags.length <= 1 && conf >= 0.7) band = 'A';
    else if (newScore >= 620 && newScore <= 719 && flags.length <= 2 && conf >= 0.65) band = 'B';
    else if ((newScore >= 520 && newScore <= 619) || (flags.length === 3 && conf >= 0.6)) band = 'C';
    else band = 'D';

    return {
      user: {
        ...state.user,
        creditScore: {
          score: newScore,
          confidence: conf,
          band,
          flags,
          featureBreakdown: { dd, rs, ep, bb, tm, sr }
        }
      }
    };
  }),

  reset: () => set({ user: INITIAL_USER })
}));
