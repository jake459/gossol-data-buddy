import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Branch = {
  id: string;
  name: string;
  address: string | null;
};

type BranchContextValue = {
  branches: Branch[];
  selectedId: string | null;
  selected: Branch | null;
  loading: boolean;
  setSelectedId: (id: string | null) => void;
  refresh: () => Promise<void>;
};

const BranchContext = createContext<BranchContextValue | undefined>(undefined);
const STORAGE_KEY = "gossol:selected-branch";

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedId, setSelectedIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });
  const [loading, setLoading] = useState(false);

  const setSelectedId = useCallback((id: string | null) => {
    setSelectedIdState(id);
    if (typeof window !== "undefined") {
      if (id) window.localStorage.setItem(STORAGE_KEY, id);
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setBranches([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("branches")
      .select("id, name, address")
      .order("created_at", { ascending: true });
    setLoading(false);
    if (error) {
      console.error("[branches] load failed", error);
      return;
    }
    setBranches(data ?? []);
    if (data && data.length > 0 && (!selectedId || !data.find((b) => b.id === selectedId))) {
      setSelectedId(data[0].id);
    }
    if (data && data.length === 0) setSelectedId(null);
  }, [user, selectedId, setSelectedId]);

  useEffect(() => {
    refresh();
  }, [user]);

  const selected = branches.find((b) => b.id === selectedId) ?? null;

  return (
    <BranchContext.Provider value={{ branches, selectedId, selected, loading, setSelectedId, refresh }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
}
