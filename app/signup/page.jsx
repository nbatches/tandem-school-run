"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

async function ensureProfile(user, additionalData = {}) {
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,                               // must match auth.users.id
        email: user.email,
        name: additionalData.name || user.user_metadata?.full_name || null,
        children: additionalData.children || null,
        school: additionalData.school || null,
        photo_consent: additionalData.photo_consent || false,
        notifications_enabled: true,               // default to enabled
        is_verified: false,                        // default to not verified
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }                         // use PK
    );
  if (error) {
    console.error("Profile upsert error:", error);
    throw error;
  }
}

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    children: "",
    school: "",
    photoConsent: false
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Safety net on any auth change
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && event === 'SIGNED_IN') {
        try {
          await ensureProfile(session.user);
          setMsg("Account created successfully! Redirecting...");
          // Redirect to dashboard or main app
          // window.location.href = "/dashboard";
        } catch (e) {
          console.error("Profile creation error:", e);
          setErr(e.message ?? "Profile creation failed.");
        }
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    setLoading(true);

    try {
      // Basic validation
      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      console.log("Starting signup for:", formData.email);

      // Step 1: Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { 
          data: { 
            full_name: formData.name 
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error("No user data returned from signup");
      }

      console.log("Auth user created:", authData.user.id);

      // Step 2: Create profile (if user is immediately confirmed)
      if (authData.user.email_confirmed_at) {
        console.log("User immediately confirmed, creating profile");
        await ensureProfile(authData.user, {
          name: formData.name,
          children: formData.children,
          school: formData.school,
          photo_consent: formData.photoConsent
        });
        setMsg("Account created successfully!");
      } else {
        console.log("Email confirmation required");
        setMsg("Please check your email to confirm your account.");
      }

    } catch (error) {
      console.error("Signup error:", error);
      setErr(error.message || "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Create your Tandem account</h1>
      <form onSubmit={handleSignup} className="flex flex-col gap-3">
        <input
          type="text"
          name="name"
          placeholder="Your full name"
          value={formData.name}
          onChange={handleInputChange}
          className="border p-2 rounded"
          required
        />
        
        <input
          type="email"
          name="email"
          placeholder="Email address"
          value={formData.email}
          onChange={handleInputChange}
          className="border p-2 rounded"
          required
        />
        
        <input
          type="password"
          name="password"
          placeholder="Password (min 6 characters)"
          value={formData.password}
          onChange={handleInputChange}
          className="border p-2 rounded"
          minLength={6}
          required
        />
        
        <input
          type="text"
          name="children"
          placeholder="Children's names (e.g., Jacob, Emma)"
          value={formData.children}
          onChange={handleInputChange}
          className="border p-2 rounded"
        />
        
        <input
          type="text"
          name="school"
          placeholder="School name"
          value={formData.school}
          onChange={handleInputChange}
          className="border p-2 rounded"
        />
        
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="photoConsent"
            checked={formData.photoConsent}
            onChange={handleInputChange}
          />
          I consent to photos of my child(ren) being shared through this app
        </label>
        
        <button 
          type="submit" 
          className="bg-black text-white p-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
        
        {msg && <p className="text-green-700">{msg}</p>}
        {err && <p className="text-red-700">{err}</p>}
      </form>
      
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <a href="/signin" className="text-blue-600 hover:underline">
          Sign in
        </a>
      </p>
    </main>
  );
}
