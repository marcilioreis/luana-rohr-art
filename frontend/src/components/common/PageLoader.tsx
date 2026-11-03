import { Mandala } from "@/components/brand/Mandala";

/** Loading de marca — mandala girando devagar (elegante). */
export default function PageLoader({
  label = "Carregando…",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Mandala className="h-12 w-12 animate-spin text-primary [animation-duration:3s]" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
