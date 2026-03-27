"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getInsforge } from "@/lib/insforge/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await getInsforge().auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-text-primary tracking-tight">
            CONTENT OS
          </h1>
          <p className="text-text-muted text-sm mt-2 font-body">
            Your content command center
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-xl p-6 space-y-4"
        >
          {error && (
            <div className="bg-coral/10 border border-coral/30 text-coral text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-text-muted text-xs font-body uppercase tracking-wider mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-text-primary font-body text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-text-muted text-xs font-body uppercase tracking-wider mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-text-primary font-body text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-coral hover:bg-coral/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-body font-semibold text-sm rounded-lg py-2.5 transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
