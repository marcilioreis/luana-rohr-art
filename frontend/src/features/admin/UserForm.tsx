import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetRolesQuery,
} from "./adminApi";
import { toast } from "sonner";
import type { AdminUser } from "./admin.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface UserFormProps {
  initialUser?: AdminUser;
}

export default function UserForm({ initialUser }: UserFormProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(initialUser);

  const { data: allRoles = [] } = useGetRolesQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const [name, setName] = useState(() => initialUser?.name ?? "");
  const [email, setEmail] = useState(() => initialUser?.email ?? "");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(() => initialUser?.active ?? true);
  const [selectedRoles, setSelectedRoles] = useState<number[]>(
    () => initialUser?.roles?.map((r) => r.roleId) ?? [],
  );

  const toggleRole = (roleId: number) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : [...prev, roleId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    if (!isEditing && !password) {
      toast.error("Informe uma senha para o novo usuário.");
      return;
    }

    try {
      if (isEditing) {
        await updateUser({
          id: id!,
          body: {
            name: name.trim(),
            email: email.trim(),
            active,
            roleIds: selectedRoles,
          },
        }).unwrap();
        toast.success("Usuário atualizado.");
      } else {
        await createUser({
          name: name.trim(),
          email: email.trim(),
          password,
          active,
          roleIds: selectedRoles,
        }).unwrap();
        toast.success("Usuário criado com sucesso.");
      }
      navigate("/admin/users");
    } catch {
      toast.error("Erro ao salvar usuário.");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-medium tracking-tight mb-6">
        {isEditing ? "Editar Usuário" : "Novo Usuário"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-card p-6 rounded-xl shadow-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="user-name">Nome</Label>
          <Input
            id="user-name"
            data-testid="user-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="user-email">E-mail</Label>
          <Input
            id="user-email"
            data-testid="user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {!isEditing && (
          <div className="space-y-2">
            <Label htmlFor="user-password">Senha</Label>
            <Input
              id="user-password"
              data-testid="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
            />
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="user-active"
            checked={active}
            onCheckedChange={(checked) => setActive(!!checked)}
          />
          <Label htmlFor="user-active">Ativo</Label>
        </div>
        <fieldset>
          <legend className="text-sm font-medium mb-2">Roles</legend>
          {allRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma permissão disponível.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {allRoles.map((role) => (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`user-role-${role.id}`}
                    checked={selectedRoles.includes(role.id)}
                    onCheckedChange={() => toggleRole(role.id)}
                  />
                  <Label
                    htmlFor={`user-role-${role.id}`}
                    className="capitalize"
                  >
                    {role.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </fieldset>
        <div className="flex gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate("/admin/users")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {isCreating || isUpdating ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
