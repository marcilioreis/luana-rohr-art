import { api } from "../../lib/api";
import type { AdminUser, AdminRole, AdminPermission } from "./admin.types";

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Usuários
    getUsers: builder.query<AdminUser[], void>({
      query: () => "/admin/users",
      providesTags: ["AdminUser"],
    }),
    getUserById: builder.query<AdminUser, string>({
      query: (id) => `/admin/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminUser", id }],
    }),
    createUser: builder.mutation<
      AdminUser,
      {
        email: string;
        password: string;
        name: string;
        active: boolean;
        roleIds: number[];
      }
    >({
      query: (body) => ({
        url: "/admin/users",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminUser"],
    }),
    updateUser: builder.mutation<
      AdminUser,
      {
        id: string;
        body: Partial<
          Pick<AdminUser, "name" | "email" | "active"> & { roleIds: number[] }
        >;
      }
    >({
      query: ({ id, body }) => ({
        url: `/admin/users/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdminUser", id }],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminUser"],
    }),

    // Roles
    getRoles: builder.query<AdminRole[], void>({
      query: () => "/admin/roles",
      providesTags: ["AdminRole"],
    }),
    getRoleById: builder.query<AdminRole, number>({
      query: (id) => `/admin/roles/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminRole", id }],
    }),
    createRole: builder.mutation<
      AdminRole,
      { name: string; description?: string; permissions: number[] }
    >({
      query: (body) => ({
        url: "/admin/roles",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminRole"],
    }),
    updateRole: builder.mutation<
      AdminRole,
      {
        id: number;
        body: Partial<
          Pick<AdminRole, "name" | "description"> & { permissions: number[] }
        >;
      }
    >({
      query: ({ id, body }) => ({
        url: `/admin/roles/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdminRole", id }],
    }),
    deleteRole: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminRole"],
    }),

    // Permissões
    getPermissions: builder.query<AdminPermission[], void>({
      query: () => "/admin/permissions",
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetPermissionsQuery,
} = adminApi;
