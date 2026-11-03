import { useParams } from "react-router-dom";
import { useGetAdminProductQuery } from "../../products/productsApi";
import AdminProductForm from "./AdminProductForm";
import PageLoader from "@/components/common/PageLoader";

export default function AdminProductFormWrapper() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { data: product, isLoading } = useGetAdminProductQuery(Number(id), {
    skip: !isEditing,
  });

  if (isEditing && isLoading) {
    return <PageLoader label="Carregando produto…" />;
  }

  return <AdminProductForm key={id ?? "new"} product={product} />;
}
