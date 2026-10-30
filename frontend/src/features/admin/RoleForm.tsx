import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useGetPermissionsQuery,
} from "./adminApi";
import { toast } from "sonner";
import type { AdminRole } from "./admin.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface RoleFormProps {
  initialRole?: AdminRole;
}

export default function RoleForm({ initialRole }: RoleFormProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(initialRole);

  const { data: allPermissions = [] } = useGetPermissionsQuery();
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();

  const [name, setName] = useState(() => initialRole?.name ?? "");
  const [description, setDescription] = useState(
    () => initialRole?.description ?? "",
  );
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>(
    () => initialRole?.permissions?.map((p) => p.permissionId) ?? [],
  );

  const togglePermission = (permId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((p) => p !== permId)
        : [...prev, permId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome da permissão.");
      return;
    }
    try {
      if (isEditing) {
        await updateRole({
          id: Number(id),
          body: {
            name: name.trim(),
            description: description.trim(),
            permissions: selectedPermissions,
          },
        }).unwrap();
        toast.success("Permissão atualizada.");
      } else {
        await createRole({
          name: name.trim(),
          description: description.trim(),
          permissions: selectedPermissions,
        }).unwrap();
        toast.success("Permissão criada.");
      }
      navigate("/admin/roles");
    } catch {
      toast.error("Erro ao salvar permissão.");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? "Editar Permissão" : "Nova Permissão"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-card p-6 rounded-xl shadow-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="role-name">Nome</Label>
          <Input
            id="role-name"
            data-testid="role-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role-description">Descrição</Label>
          <Textarea
            id="role-description"
            data-testid="role-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <fieldset>
          <legend className="text-sm font-medium mb-2">Permissões</legend>
          {allPermissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma permissão cadastrada.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
              {allPermissions.map((perm) => (
                <div key={perm.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-perm-${perm.id}`}
                    checked={selectedPermissions.includes(perm.id)}
                    onCheckedChange={() => togglePermission(perm.id)}
                  />
                  <Label htmlFor={`role-perm-${perm.id}`} className="text-sm">
                    {perm.code}
                    {perm.description && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({perm.description})
                      </span>
                    )}
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
            onClick={() => navigate("/admin/roles")}
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
