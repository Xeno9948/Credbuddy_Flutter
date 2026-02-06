import React, { createContext, useContext, useState, useEffect } from "react";
import { useSeedData, useUserDetail } from "./api";

interface SessionContextType {
  userId: number | null;
  setUserId: (id: number | null) => void;
  seeded: boolean;
}

const SessionContext = createContext<SessionContextType>({
  userId: null,
  setUserId: () => {},
  seeded: false,
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<number | null>(null);
  const [seeded, setSeeded] = useState(false);
  const seedMutation = useSeedData();

  useEffect(() => {
    if (!seeded) {
      seedMutation.mutate(undefined, {
        onSuccess: (data) => {
          setUserId(data.userId);
          setSeeded(true);
        },
        onError: () => {
          setSeeded(true);
        },
      });
    }
  }, []);

  return (
    <SessionContext.Provider value={{ userId, setUserId, seeded }}>
      {children}
    </SessionContext.Provider>
  );
}
