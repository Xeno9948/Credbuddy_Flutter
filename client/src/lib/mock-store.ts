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

export interface ScoreSnapshot {
  score: number; // 0-1000
  confidence: number; // 0-1
  band: 'A' | 'B' | 'C' | 'D';
  flags: string[]; // ["R1", "R2"]
}

export interface UserState {
  name: string;
  businessName: string;
  businessType: BusinessType;
  entries: DailyEntry[];
  creditScore: ScoreSnapshot;
  onboardingStep: number; // For simulation
}

interface AppStore {
  user: UserState;
  addEntry: (entry: Omit<DailyEntry, 'id'>) => void;
  updateUser: (data: Partial<UserState>) => void;
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
    flags: []
  },
  onboardingStep: 3 // Completed
};

export const useAppStore = create<AppStore>((set, get) => ({
  user: INITIAL_USER,
  
  addEntry: (entry) => set((state) => {
    const newEntry = { ...entry, id: Math.random().toString(36).substring(7) };
    const newEntries = [newEntry, ...state.user.entries];
    
    // Simple mock recalculation trigger
    setTimeout(() => get().recalculateScore(), 100);
    
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

  recalculateScore: () => set((state) => {
    // Very basic mock logic to simulate score changing based on entries
    const entries = state.user.entries;
    const avgRev = entries.reduce((acc, e) => acc + e.revenueCents, 0) / (entries.length || 1);
    const avgExp = entries.reduce((acc, e) => acc + e.expenseCents, 0) / (entries.length || 1);
    const net = avgRev - avgExp;
    
    let newScore = 600;
    let band: ScoreSnapshot['band'] = 'C';
    let flags: string[] = [];

    if (net > 50000) newScore += 100;
    if (net > 20000) newScore += 50;
    if (entries.length > 10) newScore += 50;
    if (net < 0) {
        newScore -= 150;
        flags.push("R2 Sustained deficit");
    }

    if (newScore >= 720) band = 'A';
    else if (newScore >= 620) band = 'B';
    else if (newScore >= 520) band = 'C';
    else band = 'D';

    return {
      user: {
        ...state.user,
        creditScore: {
          score: newScore,
          confidence: Math.min(0.5 + (entries.length * 0.05), 0.9),
          band,
          flags
        }
      }
    };
  }),

  reset: () => set({ user: INITIAL_USER })
}));
