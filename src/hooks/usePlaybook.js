import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export const EMPTY_SETUP = {
  title:       "",
  market:      "Forex",
  direction:   "Both",
  timeframe:   "H1",
  description: "",
  entry_rules: "",
  sl_rules:    "",
  tp_rules:    "",
  checklist:   [],   // string[]
  tags:        [],
  color:       "#00d4aa",
  screenshotUrl: "",
};

export const TIMEFRAMES  = ["M1","M5","M15","M30","H1","H4","D1","W1"];
export const DIRECTIONS  = ["BUY only","SELL only","Both"];
export const SETUP_COLORS = ["#00d4aa","#3b82f6","#f59e0b","#ec4899","#8b5cf6","#ef4444","#10b981"];

export function usePlaybook() {
  const [setups,  setSetups]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // ── Load ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load(session) {
      if (!session) {
        if (!cancelled) { setSetups([]); setLoading(false); }
        return;
      }
      const { data, error } = await supabase
        .from("playbook")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!cancelled) {
        if (error) {
          setError("Gagal load playbook: " + error.message);
        } else if (data) {
          setSetups(data.map(s => ({ ...s, screenshotUrl: s.screenshot_url ?? "" })));
        }
        setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => load(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!cancelled) load(session);
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  // ── Add ───────────────────────────────────────────────────────
  const addSetup = useCallback(async (form) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    // Explicitly pick columns to avoid sending unknown fields to Supabase
    const row = {
      user_id:       session.user.id,
      title:         form.title?.trim(),
      market:        form.market        ?? "Forex",
      direction:     form.direction     ?? "Both",
      timeframe:     form.timeframe     ?? "H1",
      description:   form.description   ?? "",
      entry_rules:   form.entry_rules   ?? "",
      sl_rules:      form.sl_rules      ?? "",
      tp_rules:      form.tp_rules      ?? "",
      checklist:     form.checklist     ?? [],
      tags:          form.tags          ?? [],
      color:         form.color         ?? "#00d4aa",
      screenshot_url: form.screenshotUrl ?? "",  // snake_case for Supabase
      created_at:    new Date().toISOString(),
      updated_at:    new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("playbook").insert(row).select().single();

    if (error) {
      console.error("Add setup error:", error.message, error.details, error.hint);
      setError("Gagal simpan setup: " + error.message);
      return null;
    }

    // Normalize back to camelCase for frontend
    const normalized = { ...data, screenshotUrl: data.screenshot_url };
    setSetups(prev => [normalized, ...prev]);
    return normalized;
  }, []);

  // ── Update ────────────────────────────────────────────────────
  const updateSetup = useCallback(async (id, patch) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const updated = {
      title:          patch.title?.trim(),
      market:         patch.market,
      direction:      patch.direction,
      timeframe:      patch.timeframe,
      description:    patch.description   ?? "",
      entry_rules:    patch.entry_rules   ?? "",
      sl_rules:       patch.sl_rules      ?? "",
      tp_rules:       patch.tp_rules      ?? "",
      checklist:      patch.checklist     ?? [],
      tags:           patch.tags          ?? [],
      color:          patch.color         ?? "#00d4aa",
      screenshot_url: patch.screenshotUrl ?? "",
      updated_at:     new Date().toISOString(),
    };

    const { error } = await supabase
      .from("playbook").update(updated)
      .eq("id", id).eq("user_id", session.user.id);

    if (error) { console.error("Update setup error:", error.message); return; }
    // Merge patch back with camelCase key
    setSetups(prev => prev.map(s => s.id === id ? { ...s, ...patch, screenshot_url: patch.screenshotUrl, updated_at: updated.updated_at } : s));
  }, []);

  // ── Delete ────────────────────────────────────────────────────
  const deleteSetup = useCallback(async (id) => {
    if (!window.confirm("Hapus setup ini dari playbook?")) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("playbook").delete()
      .eq("id", id).eq("user_id", session.user.id);

    if (error) { console.error("Delete setup error:", error.message); return; }
    setSetups(prev => prev.filter(s => s.id !== id));
  }, []);

  return { setups, loading, error, setError, addSetup, updateSetup, deleteSetup };
}