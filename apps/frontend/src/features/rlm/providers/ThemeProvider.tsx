"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  /** The current theme setting */
  theme: Theme;
  /** The resolved theme (light or dark) based on system preference if theme is 'system' */
  resolvedTheme: "light" | "dark";
  /** Sets the theme preference */
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "rlm-theme";

/**
 * Provides theme context to the application.
 *
 * Manages light/dark mode with system preference detection and localStorage persistence.
 *
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @returns The provider component
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Get system preference
  const getSystemTheme = useCallback((): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, []);

  // Apply theme to document
  const applyTheme = useCallback(
    (newTheme: Theme) => {
      const resolved = newTheme === "system" ? getSystemTheme() : newTheme;
      setResolvedTheme(resolved);

      // Update document class
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(resolved);
    },
    [getSystemTheme]
  );

  // Set theme and persist
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      localStorage.setItem(STORAGE_KEY, newTheme);
      applyTheme(newTheme);
    },
    [applyTheme]
  );

  // Initialize on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initialTheme = stored || "system";
    setThemeState(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, [applyTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, applyTheme]);

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access and control the current theme.
 *
 * @returns Theme context with current theme, resolved theme, and setter
 * @throws If used outside of ThemeProvider
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
