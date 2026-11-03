import { useParams } from "react-router-dom";
import { useGetUserByIdQuery } from "./adminApi";
import UserForm from "./UserForm";
import PageLoader from "@/components/common/PageLoader";

export default function UserFormWrapper() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { data: user, isLoading } = useGetUserByIdQuery(id!, {
    skip: !isEditing,
  });

  if (isEditing && isLoading) {
    return <PageLoader label="Carregando usuário…" />;
  }

  return <UserForm key={id ?? "new"} initialUser={user} />;
}
