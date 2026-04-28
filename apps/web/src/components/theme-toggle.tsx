"use client";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
      style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
      aria-label="Toggle theme"
    >
      {theme === "dark"
        ? <Sun size={15} />
        : <Moon size={15} />}
    </button>
  );
}