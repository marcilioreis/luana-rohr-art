import { api } from "../../lib/api";
import { login as authLogin, register as authRegister } from "../../lib/auth";
import type { BetterAuthUser, ApiError } from "../../lib/auth.types";
import { authClient } from "../../lib/auth";

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
  image?: string | null;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// Type guard para a resposta da sessão
interface SessionResponse {
  user: BetterAuthUser;
  session: { token: string; expiresAt?: string };
  permissions?: string[];
  roles?: string[];
}

// Type guard para verificar se o objeto tem 'user'
function hasUser(obj: unknown): obj is { user: BetterAuthUser } {
  return typeof obj === "object" && obj !== null && "user" in obj;
}

// Type guard para a resposta de updateUser
function isUpdateUserResponse(obj: unknown): obj is { user: BetterAuthUser } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "user" in obj &&
    typeof (obj as Record<string, unknown>).user === "object"
  );
}

// Função auxiliar para extrair o usuário da resposta do Better Auth
const extractUser = (response: unknown): User | null => {
  if (typeof response !== "object" || response === null) return null;

  // Tenta acessar data.user ou user
  const data = (response as Record<string, unknown>).data ?? response;
  if (hasUser(data)) {
    const user = data.user;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt?.toString(), //new Date(user.createdAt).toLocaleDateString();
      updatedAt: user.updatedAt?.toString(),
      image: user.image,
    };
  }
  return null;
};

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<{ user: User }, LoginRequest>({
      queryFn: async (credentials) => {
        try {
          const result = await authLogin(
            credentials.email,
            credentials.password,
          );
          const user = extractUser(result);
          if (!user) {
            return {
              error: {
                status: 401,
                data: "Resposta de login inválida",
              },
            };
          }
          return { data: { user } };
        } catch (error) {
          const err = error as ApiError;
          return {
            error: {
              status: err.status || 401,
              data: err.data || "Falha na autenticação",
            },
          };
        }
      },
    }),
    register: builder.mutation<{ user: User }, RegisterRequest>({
      queryFn: async (userData) => {
        try {
          const result = await authRegister(
            userData.email,
            userData.password,
            userData.name,
          );
          const user = extractUser(result);
          if (!user) {
            return {
              error: {
                status: 400,
                data: "Resposta de registro inválida",
              },
            };
          }
          return { data: { user } };
        } catch (error) {
          const err = error as ApiError;
          return {
            error: {
              status: err.status || 400,
              data: err.data || "Falha no cadastro",
            },
          };
        }
      },
    }),
    getCurrentUser: builder.query<SessionResponse, void>({
      query: () => "/auth/get-session",
    }),
    // Substitua o endpoint "updateUser" por "updateProfile"
    updateProfile: builder.mutation<
      User,
      Partial<Pick<User, "name" | "email">>
    >({
      queryFn: async (patch) => {
        try {
          const result = await authClient.updateUser(patch);
          const responseData: unknown =
            (result as Record<string, unknown>).data ?? result;
          if (isUpdateUserResponse(responseData)) {
            const u = responseData.user;
            return {
              data: {
                id: u.id,
                email: u.email,
                name: u.name,
                emailVerified: u.emailVerified,
                createdAt: u.createdAt?.toString(),
                updatedAt: u.updatedAt?.toString(),
                image: u.image,
              },
            };
          }
          return { error: { status: 400, data: "Falha ao atualizar perfil." } };
        } catch (error: unknown) {
          const message =
            error instanceof Error
              ? error.message
              : "Falha ao atualizar perfil.";
          return { error: { status: 400, data: message } };
        }
      },
    }),
    // Mutation changePassword (inalterada, apenas removi toast)
    changePassword: builder.mutation<
      void,
      { currentPassword: string; newPassword: string }
    >({
      queryFn: async (passwords) => {
        try {
          await authClient.changePassword(passwords);
          return { data: undefined };
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "Falha ao alterar senha.";
          return { error: { status: 400, data: message } };
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = authApi;
