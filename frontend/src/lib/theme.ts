import { createContext, useContext } from "react";

/** Preferência escolhida pela pessoa: "system" segue o SO. */
export type Theme = "light" | "dark" | "system";

/** Tema efetivamente aplicado no documento. */
export type ResolvedTheme = "light" | "dark";

/**
 * Chave do localStorage. ATENÇÃO: o script anti-flash em `index.html` repete
 * esta string literalmente — mudou aqui, muda lá.
 */
export const THEME_STORAGE_KEY = "lra-theme";

/** Cor da barra do navegador (Android/PWA) por tema. */
const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: "#243C8C", // azul de marca
  dark: "#14161E", // equivalente a --background do tema escuro
};

const DARK_QUERY = "(prefers-color-scheme: dark)";

export function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

/** Lê a preferência salva; volta para "system" se ausente ou inválida. */
export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage bloqueado (aba anônima / cookies desativados)
  }
  return "system";
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage bloqueado: o tema vale só para esta sessão
  }
}

/**
 * Aplica o tema no documento. A classe `.dark` ativa os tokens e a variante
 * `dark:`; o `color-scheme` vem do CSS (`:root` / `.dark`) e acerta
 * scrollbars e controles nativos.
 */
export function applyTheme(resolved: ResolvedTheme): void {
  document.documentElement.classList.toggle("dark", resolved === "dark");

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLORS[resolved]);
}

/** Observa mudanças do tema do SO. Devolve a função de limpeza. */
export function watchSystemTheme(
  onChange: (resolved: ResolvedTheme) => void,
): () => void {
  const media = window.matchMedia(DARK_QUERY);
  const listener = (event: MediaQueryListEvent) =>
    onChange(event.matches ? "dark" : "light");

  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

export interface ThemeContextValue {
  /** O que a pessoa escolheu ("system" inclusive). */
  theme: Theme;
  /** O que está valendo na tela ("light" ou "dark"). */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme precisa estar dentro de <ThemeProvider>");
  }
  return context;
}
