import { useParams } from "react-router-dom";
import { useGetUserByIdQuery } from "./adminApi";
import UserForm from "./UserForm";

export default function UserFormWrapper() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { data: user, isLoading } = useGetUserByIdQuery(id!, {
    skip: !isEditing,
  });

  if (isEditing && isLoading) {
    return <div className="p-4">Carregando usuário...</div>;
  }

  return <UserForm key={id ?? "new"} initialUser={user} />;
}
