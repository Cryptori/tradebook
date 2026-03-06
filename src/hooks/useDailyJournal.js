import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export const MARKET_BIAS = ["Bullish", "Bearish", "Sideways", "Uncertain"];
export const JOURNAL_MOODS = ["🔥 Focused", "😌 Calm", "😤 Frustrated", "😴 Tired", "💪 Confident", "😰 Anxious"];

export function useDailyJournal() {
  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  // ── Load ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load(session) {
      if (!session) {
        if (!cancelled) { setEntries([]); setLoading(false); }
        return;
      }
      const { data, error } = await supabase
        .from("daily_journal")
        .select("*")
        .eq("user_id", session.user.id)
        .order("date", { ascending: false });

      if (!cancelled) {
        if (error) setError("Gagal load journal: " + error.message);
        else if (data) setEntries(data);
        setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => load(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!cancelled) load(s);
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  // ── Upsert (create or update by date) ────────────────────────
  const saveEntry = useCallback(async (form) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const row = {
      user_id:       session.user.id,
      date:          form.date,
      mood:          form.mood          ?? "",
      market_bias:   form.market_bias   ?? "Uncertain",
      watchlist:     form.watchlist     ?? "",
      pre_market:    form.pre_market    ?? "",
      post_market:   form.post_market   ?? "",
      lessons:       form.lessons       ?? "",
      goals:         form.goals         ?? "",
      rating:        form.rating        ?? 3,
      updated_at:    new Date().toISOString(),
    };

    // Upsert by user_id + date
    const { data, error } = await supabase
      .from("daily_journal")
      .upsert(row, { onConflict: "user_id,date" })
      .select().single();

    if (error) { setError("Gagal simpan: " + error.message); return null; }

    setEntries(prev => {
      const exists = prev.find(e => e.date === form.date);
      return exists
        ? prev.map(e => e.date === form.date ? data : e)
        : [data, ...prev];
    });
    return data;
  }, []);

  // ── Delete ────────────────────────────────────────────────────
  const deleteEntry = useCallback(async (id) => {
    if (!window.confirm("Hapus jurnal hari ini?")) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("daily_journal").delete()
      .eq("id", id).eq("user_id", session.user.id);

    if (error) { setError("Gagal hapus: " + error.message); return; }
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  // ── Get entry by date ─────────────────────────────────────────
  const getEntryByDate = useCallback((date) => {
    return entries.find(e => e.date === date) ?? null;
  }, [entries]);

  return { entries, loading, error, saveEntry, deleteEntry, getEntryByDate };
}