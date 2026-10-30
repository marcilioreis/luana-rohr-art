import { useState } from "react";
import { useAppSelector } from "../../app/hooks";
import { useUpdateProfileMutation, useChangePasswordMutation } from "./authApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
  const user = useAppSelector((state) => state.auth.user);
  const [updateUser, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChanging }] =
    useChangePasswordMutation();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser({ name, email }).unwrap();
      toast.success("Perfil atualizado.");
    } catch {
      toast.error("Erro ao atualizar.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      toast.success("Senha alterada.");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      toast.error("Erro ao alterar a senha.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informações pessoais</CardTitle>
          <CardDescription>Atualize seu nome e e‑mail.</CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdateProfile}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nome</Label>
              <Input
                id="profile-name"
                name="profile-name"
                data-testid="profile-name"
                type="text"
                placeholder="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">E‑mail</Label>
              <Input
                id="profile-email"
                name="profile-email"
                data-testid="profile-email"
                type="email"
                placeholder="E‑mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={isUpdating}
              data-testid="profile-update-submit"
            >
              {isUpdating ? "Salvando..." : "Atualizar perfil"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
          <CardDescription>Recomendamos usar uma senha forte.</CardDescription>
        </CardHeader>
        <form onSubmit={handleChangePassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-current-password">Senha atual</Label>
              <Input
                id="profile-current-password"
                name="current-password"
                data-testid="profile-current-password"
                type="password"
                placeholder="Senha atual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-new-password">Nova senha</Label>
              <Input
                id="profile-new-password"
                name="new-password"
                data-testid="profile-new-password"
                type="password"
                placeholder="Nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={isChanging}
              data-testid="change-password-submit"
            >
              {isChanging ? "Alterando..." : "Alterar senha"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
