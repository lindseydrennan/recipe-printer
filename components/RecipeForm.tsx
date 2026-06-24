"use client";

import { useState } from "react";

type State = "idle" | "loading" | "error";

export default function RecipeForm() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setState("loading");
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Something went wrong." }));
        throw new Error(data.error || "Something went wrong.");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? "recipe.pdf";

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objectUrl);

      setState("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/recipe/..."
          required
          disabled={state === "loading"}
          className="flex-1 rounded-lg border border-borders bg-white px-4 py-3 text-sm text-headlines placeholder:text-borders focus:outline-none focus:ring-2 focus:ring-dark-green/30 focus:border-dark-green disabled:opacity-50 transition"
        />
        <button
          type="submit"
          disabled={state === "loading" || !url.trim()}
          className="rounded-lg bg-dark-green px-6 py-3 text-sm font-semibold text-white hover:bg-dark-green/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
        >
          {state === "loading" ? (
            <span className="flex items-center gap-2">
              <Spinner />
              Generating…
            </span>
          ) : (
            "Get PDF"
          )}
        </button>
      </div>

      {state === "error" && (
        <p className="text-sm text-burnt-orange">{error}</p>
      )}
    </form>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}
