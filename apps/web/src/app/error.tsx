"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ServerCrash } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("Dashboard API Error:", error);
    
    // Automatically attempt to retry after 5 seconds if it's a 502/cold-start
    const timer = setTimeout(() => {
      handleRetry();
    }, 5000);

    return () => clearTimeout(timer);
  }, [error]);

  const handleRetry = async () => {
    setRetrying(true);
    reset(); // Re-renders the segment
    setTimeout(() => setRetrying(false), 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <div className="max-w-md w-full p-8 rounded-2xl border text-center space-y-6 shadow-2xl" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--bg-tertiary)" }}>
          <ServerCrash size={32} style={{ color: "var(--gold)" }} />
        </div>
        
        <h2 className="text-2xl font-bold tracking-tight">Waking up the market...</h2>
        
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Our backend API is hosted on a free tier and takes about <strong style={{ color: "var(--text-primary)" }}>30-50 seconds</strong> to spin up from sleep. 
          <br /><br />
          Please hold on, we are automatically retrying the connection.
        </p>

        <button
          onClick={handleRetry}
          disabled={retrying}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all"
          style={{ background: "var(--gold)", color: "#1a1816" }}
        >
          <RefreshCw size={18} className={retrying ? "animate-spin" : ""} />
          {retrying ? "Reconnecting..." : "Try Again Now"}
        </button>
      </div>
    </div>
  );
}
