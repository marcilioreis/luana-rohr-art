import { useParams } from "react-router-dom";
import { useGetRoleByIdQuery } from "./adminApi";
import RoleForm from "./RoleForm";

export default function RoleFormWrapper() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { data: role, isLoading } = useGetRoleByIdQuery(Number(id!), {
    skip: !isEditing,
  });

  if (isEditing && isLoading) {
    return <div className="p-4">Carregando role...</div>;
  }

  return <RoleForm key={id ?? "new"} initialRole={role} />;
}
