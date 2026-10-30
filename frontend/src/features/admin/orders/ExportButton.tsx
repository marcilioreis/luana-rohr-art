import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  useRequestExportMutation,
  useLazyGetExportStatusQuery,
} from "../../account/ordersApi";
import type { OrderStatus } from "../../account/orders.types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";

type ExportFormat = "csv" | "pdf" | "xlsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function downloadFile(link: string, format: string) {
  // Links S3 são absolutos e públicos; links locais exigem o Bearer token.
  if (link.startsWith("http")) {
    window.open(link, "_blank");
    return;
  }
  const token = localStorage.getItem("auth-token");
  const res = await fetch(`${API_BASE}${link}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pedidos.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportButton({ status }: { status?: OrderStatus }) {
  const [requestExport, { isLoading: isRequesting }] =
    useRequestExportMutation();
  const [triggerStatus] = useLazyGetExportStatusQuery();
  const [exportId, setExportId] = useState<number | null>(null);
  const [format, setFormat] = useState<ExportFormat>("csv");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorCountRef = useRef(0);

  const stopPolling = (msg?: string) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setExportId(null);
    if (msg) toast.error(msg);
  };

  const startPolling = (id: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    errorCountRef.current = 0;
    intervalRef.current = setInterval(async () => {
      try {
        const st = await triggerStatus(id).unwrap();
        errorCountRef.current = 0;
        if (st.status === "concluido") {
          stopPolling();
          toast.success("Exportação concluída!");
          if (st.downloadLink) await downloadFile(st.downloadLink, format);
        } else if (st.status === "falha") {
          stopPolling("Falha na exportação.");
        }
      } catch {
        errorCountRef.current += 1;
        if (errorCountRef.current >= 3)
          stopPolling("Erro ao verificar status.");
      }
    }, 2000);
  };

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    [],
  );

  const handleExport = async () => {
    try {
      const result = await requestExport({
        format,
        filters: status ? { status } : undefined,
      }).unwrap();
      setExportId(result.exportId);
      startPolling(result.exportId);
      toast.info("Exportação iniciada. Aguarde...");
    } catch {
      toast.error("Erro ao solicitar exportação.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={format}
        onValueChange={(v) => setFormat(v as ExportFormat)}
        disabled={isRequesting || exportId != null}
      >
        <SelectTrigger className="h-9 w-28">
          <SelectValue placeholder="Formato" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="csv">CSV</SelectItem>
          <SelectItem value="pdf">PDF</SelectItem>
          <SelectItem value="xlsx">Excel</SelectItem>
        </SelectContent>
      </Select>
      <Button
        onClick={handleExport}
        disabled={isRequesting || exportId != null}
        size="sm"
      >
        <Download className="mr-2 h-4 w-4" />
        {exportId != null
          ? "Processando..."
          : isRequesting
            ? "Iniciando..."
            : "Exportar"}
      </Button>
    </div>
  );
}
