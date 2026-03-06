import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      if (u && !u.email_confirmed_at) {
        setUser(null); // session exists but email not confirmed
      } else {
        setUser(u);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      // Only set user if email is confirmed (or confirmation is disabled on Supabase)
      // This prevents auto-login after register when "Confirm email" is OFF
      if (u && !u.email_confirmed_at) {
        setUser(null); // not confirmed yet — stay on auth screen
      } else {
        setUser(u);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Sign Up ────────────────────────────────────────────────────
  // After register, Supabase sends a confirmation email.
  // User CANNOT log in until they click the link in that email.
  // Email must be real — fake/disposable addresses won't receive it.
  const signUp = useCallback(async (email, password, username) => {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username?.trim() },
        // emailRedirectTo tells Supabase where to redirect after confirmation.
        // Change this to your production URL when deploying.
        emailRedirectTo: window.location.origin,
      },
    });

    setLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        setError("Email ini sudah terdaftar. Silakan login.");
      } else {
        setError(error.message);
      }
      return { success: false };
    }

    // success = email confirmation sent, NOT yet logged in
    return { success: true, needsConfirmation: true };
  }, []);

  // ── Sign In ────────────────────────────────────────────────────
  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      if (error.message.includes("Invalid login") || error.message.includes("invalid_credentials")) {
        setError("Email atau password salah.");
      } else if (error.message.includes("Email not confirmed")) {
        setError("Email belum dikonfirmasi. Cek inbox kamu dan klik link verifikasi.");
      } else {
        setError(error.message);
      }
      return { success: false };
    }

    // Extra check: email must be confirmed
    if (!data.user?.email_confirmed_at) {
      await supabase.auth.signOut();
      setError("Email belum dikonfirmasi. Cek inbox kamu dan klik link verifikasi.");
      return { success: false };
    }

    return { success: true };
  }, []);

  // ── Sign Out ───────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.reload();
  }, []);

  // ── Resend confirmation email ──────────────────────────────────
  const resendConfirmation = useCallback(async (email) => {
    setError("");
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      setError("Gagal kirim ulang email: " + error.message);
      return { success: false };
    }
    return { success: true };
  }, []);

  const profile = user ? {
    id:       user.id,
    username: user.user_metadata?.username ?? user.email?.split("@")[0] ?? "trader",
    email:    user.email,
  } : null;

  return {
    user,
    profile,
    loading,
    error,
    setError,
    signUp,
    signIn,
    signOut,
    resendConfirmation,
  };
}