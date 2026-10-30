import { createAuthClient } from "better-auth/client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  // A baseURL inclui '/auth' porque as rotas do Better Auth não prefixam automaticamente.
  // Isso mantém compatibilidade com o backend sem precisar sobrescrever todos os endpoints.
  // baseURL: `${API_BASE_URL}/auth`, // prefixo comum para todas as rotas de auth
  baseURL: API_BASE_URL, // prefixo comum para todas as rotas de auth
});

/**
 * Realiza login com email e senha.
 * A sessão será armazenada automaticamente em cookie HttpOnly.
 */
export const login = async (email: string, password: string) => {
  const result = await authClient.signIn.email({ email, password });
  // O token pode estar em result.token ou result.data.token – ajuste conforme a resposta real
  const token = result.data?.token;
  if (token) {
    localStorage.setItem("auth-token", token);
  }
  return result;
};

/**
 * Realiza cadastro de novo usuário.
 */
export const register = async (
  email: string,
  password: string,
  name: string,
) => {
  return await authClient.signUp.email({ email, password, name });
};

/**
 * Encerra a sessão atual.
 */
export const logout = async () => {
  await authClient.signOut();
  localStorage.removeItem("auth-token");
};

// Tipo que representa o que realmente queremos extrair
interface NormalizedSession {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    createdAt?: string;
    updatedAt?: string;
    image?: string | null;
  };
  session?: {
    token?: string;
    expiresAt?: string;
  };
}

/**
 * Type guard: verifica se um objeto parece um usuário válido.
 */
function isValidUser(user: unknown): user is NormalizedSession["user"] {
  return (
    typeof user === "object" &&
    user !== null &&
    "id" in user &&
    "email" in user &&
    "name" in user &&
    "emailVerified" in user
  );
}

/**
 * Tenta normalizar a resposta da API para o formato { user, session }.
 * Retorna null se não for possível extrair um usuário válido.
 */
function normalizeSessionResponse(response: unknown): NormalizedSession | null {
  if (typeof response !== "object" || response === null) {
    return null;
  }

  // O objeto pode ter um envelope 'data' (ex: { data: { user, session } })
  const data = (response as Record<string, unknown>).data ?? response;

  if (typeof data !== "object" || data === null) {
    return null;
  }

  const user = (data as Record<string, unknown>).user;
  const session = (data as Record<string, unknown>).session;

  if (isValidUser(user)) {
    return {
      user,
      session: session as NormalizedSession["session"] | undefined,
    };
  }

  return null;
}

/**
 * Obtém a sessão atual do usuário.
 * Retorna null se não houver sessão ativa.
 */
export const getSession = async (): Promise<NormalizedSession | null> => {
  try {
    const response = await authClient.getSession();
    return normalizeSessionResponse(response);
  } catch {
    return null;
  }
};

/**
 * Verifica se o usuário está autenticado (útil para verificações rápidas).
 */
export const isAuthenticated = async () => {
  const session = await getSession();
  return !!session?.user;
};

export const requestPasswordReset = async (email: string) => {
  return await authClient.requestPasswordReset({ email });
};

export const resetPassword = async (token: string, newPassword: string) => {
  return await authClient.resetPassword({ token, newPassword });
};
