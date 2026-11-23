import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ThemeContext,
  applyTheme,
  getStoredTheme,
  resolveTheme,
  storeTheme,
  watchSystemTheme,
  type Theme,
} from "@/lib/theme";

/**
 * Mantém a preferência de tema e a reflete no documento.
 *
 * O estado inicial é lido do localStorage de forma síncrona — o script
 * anti-flash do `index.html` já aplicou a classe antes da primeira pintura,
 * então aqui não há troca visível.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState(() => resolveTheme("system"));

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => applyTheme(resolvedTheme), [resolvedTheme]);

  // Só importa enquanto a escolha for "system", mas observar sempre mantém
  // `systemTheme` fresco caso a pessoa volte para "system".
  useEffect(() => watchSystemTheme(setSystemTheme), []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    storeTheme(next);
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
