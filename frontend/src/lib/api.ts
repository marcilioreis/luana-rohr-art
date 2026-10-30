import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { authClient } from "../lib/auth";

const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: typeof baseQuery = async (
  args,
  api,
  extraOptions,
) => {
  let result = await baseQuery(args, api, extraOptions);

  // Se recebeu 401, tenta reidratar a sessão
  if (result.error && result.error.status === 401) {
    try {
      // 1. Tenta obter uma sessão atualizada
      const sessionResponse = await authClient.getSession();

      // 2. Extrai o novo token da resposta.
      // O Bearer Plugin retorna o token no campo 'token' da sessão.
      const newToken = sessionResponse?.data?.session?.token;

      if (newToken) {
        // 3. Atualiza o token no localStorage
        localStorage.setItem("auth-token", newToken);

        // 4. Refaz a requisição original, que agora deve funcionar
        result = await baseQuery(args, api, extraOptions);
      } else {
        // 5. Se não veio token novo, a sessão expirou de vez
        localStorage.removeItem("auth-token");
        window.location.href = "/login";
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Falha ao reidratar a sessão.";
      console.error(message);
      localStorage.removeItem("auth-token");
      window.location.href = "/login";
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: [
    "Product",
    "AdminProduct",
    "Order",
    "AdminOrder",
    "Cart",
    "AdminUser",
    "AdminRole",
  ],
});
