"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Log in to Posantro</h1>
          <p className="text-sm text-zinc-400">
            Placeholder styling for now — gears &amp; theme come later.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm text-zinc-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:border-zinc-400"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm text-zinc-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:border-zinc-400"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-950/60 border border-red-800 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-100 text-zinc-950 font-medium py-2 text-sm hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="h-px flex-1 bg-zinc-800" />
          <span>OR</span>
          <span className="h-px flex-1 bg-zinc-800" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-100 font-medium py-2 text-sm hover:bg-zinc-800"
        >
          Continue with Google
        </button>

        <p className="text-sm text-zinc-400 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-zinc-100 underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
