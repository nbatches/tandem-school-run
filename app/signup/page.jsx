"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

async function ensureProfile(user) {
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,                               // must match auth.users.id
        email: user.email,
        full_name: user.user_metadata?.full_name ?? null,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }                         // use PK
    );
  if (error) throw error;
}

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Safety net on any auth change
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        try {
          await ensureProfile(session.user);
        } catch (e) {
          console.error(e);
          setErr(e.message ?? "Profile upsert failed.");
        }
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });

    if (signUpError) {
      setErr(signUpError.message);
      return;
    }

    // If email confirmation is enabled, there may be no session yet
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      try {
        await ensureProfile(data.session.user);
      } catch (e) {
        setErr(e.message ?? "Profile upsert failed.");
      }
    }

    setMsg("Check your email to confirm your account.");
  };

  return (
    <main className="max-w-sm mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Create your Tandem account</h1>
      <form onSubmit={handleSignup} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <button type="submit" className="bg-black text-white p-2 rounded">
          Sign up
        </button>
        {msg && <p className="text-green-700">{msg}</p>}
        {err && <p className="text-red-700">{err}</p>}
      </form>
    </main>
  );
}
