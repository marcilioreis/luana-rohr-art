import { Toaster } from "sonner";
import { useTheme } from "@/lib/theme";

/** Toaster do sonner acompanhando o tema atual. */
export function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      theme={resolvedTheme}
    />
  );
}
