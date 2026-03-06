// useSupabase.js — thin wrapper untuk expose supabase client + sync status
// Trade operations dilakukan langsung di useTrades.js
import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useSupabase() {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [lastSynced, setLastSynced] = useState(null);

  const fetchTrades = useCallback(async (accountId = null) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    try {
      setSyncing(true);
      setSyncError("");
      let query = supabase.from("trades").select("*").order("date", { ascending: false });
      if (accountId) query = query.eq("account_id", accountId);
      const { data, error } = await query;
      if (error) throw error;
      setLastSynced(new Date());
      return data;
    } catch (e) {
      setSyncError(e.message);
      return null;
    } finally {
      setSyncing(false);
    }
  }, []);

  const upsertTrade = useCallback(async (trade) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      setSyncing(true);
      const { error } = await supabase.from("trades").upsert(trade, { onConflict: "id" });
      if (error) throw error;
      setLastSynced(new Date());
    } catch (e) {
      setSyncError(e.message);
    } finally {
      setSyncing(false);
    }
  }, []);

  const deleteTrade = useCallback(async (id) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const { error } = await supabase.from("trades").delete().eq("id", id);
      if (error) throw error;
      setLastSynced(new Date());
    } catch (e) {
      setSyncError(e.message);
    }
  }, []);

  return {
    supabase,
    isConfigured: true,
    syncing,
    syncError,
    lastSynced,
    fetchTrades,
    upsertTrade,
    deleteTrade,
  };
}