import { isRejectedWithValue } from "@reduxjs/toolkit";
import type { Middleware } from "@reduxjs/toolkit";
import { toast } from "sonner";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

// Type guard para FetchBaseQueryError
function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === "object" && error !== null && "status" in error;
}

export const rtkQueryErrorLogger: Middleware = (api) => (next) => (action) => {
  void api;
  if (isRejectedWithValue(action)) {
    const payload = action.payload;
    if (isFetchBaseQueryError(payload)) {
      const status = payload.status;

      if (status === 401) {
        return next(action);
      }

      if (status === 403) {
        toast.error("Você não tem permissão para realizar esta ação.");
      } else if (status === 404) {
        toast.error("Recurso não encontrado.");
      } else if (status === 500) {
        toast.error("Erro interno do servidor. Tente novamente mais tarde.");
      } else {
        toast.error("Ocorreu um erro inesperado.");
      }
    } else if (payload && typeof payload === "object" && "data" in payload) {
      // Erro de rede ou parsing
      toast.error("Erro de conexão. Verifique sua internet.");
    }
  }
  return next(action);
};
