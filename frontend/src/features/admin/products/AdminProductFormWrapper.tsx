import { useParams } from "react-router-dom";
import { useGetAdminProductQuery } from "../../products/productsApi";
import AdminProductForm from "./AdminProductForm";

export default function AdminProductFormWrapper() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { data: product, isLoading } = useGetAdminProductQuery(Number(id), {
    skip: !isEditing,
  });

  if (isEditing && isLoading) {
    return <div className="p-4">Carregando produto...</div>;
  }

  return <AdminProductForm key={id ?? "new"} product={product} />;
}
