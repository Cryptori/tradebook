import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export const ACCOUNT_TYPES = ["Personal", "Prop Firm", "Demo", "Challenge"];

function makeDefault(userId) {
  return {
    id: `default_${userId}`,
    name: "Personal Account",
    type: "Personal",
    color: "#00d4aa",
    user_id: userId,
    createdAt: new Date().toISOString(),
  };
}

export function useAccounts() {
  const [accounts,        setAccounts]        = useState([]);
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [accountsLoading, setAccountsLoading] = useState(true);

  useEffect(() => {
    async function loadAccounts(session) {
      if (!session) {
        setAccounts([]);
        setActiveAccountId(null);
        setAccountsLoading(false);
        return;
      }

      const userId = session.user.id;

      // RLS on Supabase side will filter by user_id automatically.
      // But we also filter client-side as a safety net.
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)          // explicit filter — never trust RLS alone
        .order("createdAt", { ascending: true });

      if (error) {
        console.error("Load accounts error:", error.message);
        const fallback = makeDefault(userId);
        setAccounts([fallback]);
        setActiveAccountId(fallback.id);
        setAccountsLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        // Seed default account for new user
        const defaultAcc = makeDefault(userId);
        const { error: insertErr } = await supabase
          .from("accounts")
          .upsert(defaultAcc, { onConflict: "id" });
        if (insertErr) console.error("Seed account error:", insertErr.message);
        setAccounts([defaultAcc]);
        setActiveAccountId(defaultAcc.id);
      } else {
        setAccounts(data);
        setActiveAccountId(prev =>
          data.find(a => a.id === prev) ? prev : data[0].id
        );
      }
      setAccountsLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => loadAccounts(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadAccounts(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const switchAccount = useCallback((id) => {
    setActiveAccountId(id);
  }, []);

  const addAccount = useCallback(async (name, type, color) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const userId = session.user.id;
    const newAcc = {
      id: `acc_${Date.now()}`,
      name,
      type,
      color,
      user_id: userId,                  // always tag with owner
      createdAt: new Date().toISOString(),
    };

    const { error } = await supabase.from("accounts").insert(newAcc);
    if (error) { console.error("Add account error:", error.message); return null; }

    setAccounts(prev => [...prev, newAcc]);
    setActiveAccountId(newAcc.id);
    return newAcc.id;
  }, []);

  const updateAccount = useCallback(async (id, patch) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("accounts")
      .update(patch)
      .eq("id", id)
      .eq("user_id", session.user.id);  // extra safety: only own rows

    if (error) { console.error("Update account error:", error.message); return; }
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  }, []);

  const deleteAccount = useCallback(async (id) => {
    if (accounts.length <= 1) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);  // extra safety

    if (error) { console.error("Delete account error:", error.message); return; }

    setAccounts(prev => {
      const next = prev.filter(a => a.id !== id);
      if (activeAccountId === id) setActiveAccountId(next[0]?.id ?? null);
      return next;
    });
  }, [accounts.length, activeAccountId]);

  const activeAccount = accounts.find(a => a.id === activeAccountId) ?? accounts[0] ?? null;

  return {
    accounts,
    activeAccount,
    activeAccountId,
    accountsLoading,
    switchAccount,
    addAccount,
    updateAccount,
    deleteAccount,
  };
}