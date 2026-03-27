"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getInsforge } from "@/lib/insforge/client";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: authError } = await getInsforge().auth.signUp({
          email,
          password,
          name: name || undefined,
        });

        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }

        if (data?.accessToken) {
          router.push("/onboarding");
        } else if (data?.requireEmailVerification) {
          setError("Check your email for a verification link.");
          setLoading(false);
        }
      } else {
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
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-text-primary italic">
            Content OS
          </h1>
          <p className="text-text-muted text-sm mt-1.5">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-xl p-6 space-y-4"
        >
          {error && (
            <div className="bg-coral/5 border border-coral/20 text-coral text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {isSignUp && (
            <div>
              <label
                htmlFor="name"
                className="block text-text-muted text-xs uppercase tracking-wider mb-1.5"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted/50 focus:border-border-bright transition-colors"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-text-muted text-xs uppercase tracking-wider mb-1.5"
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
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted/50 focus:border-border-bright transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-text-muted text-xs uppercase tracking-wider mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? "Choose a password" : "Your password"}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted/50 focus:border-border-bright transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-text-primary hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading
              ? isSignUp ? "Creating account..." : "Signing in..."
              : isSignUp ? "Create account" : "Sign in"
            }
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-4">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="text-text-primary font-medium hover:underline"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>

        <p className="text-center mt-6">
          <a href="/" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
            &larr; Back to Content Studio
          </a>
        </p>
      </div>
    </div>
  );
}
