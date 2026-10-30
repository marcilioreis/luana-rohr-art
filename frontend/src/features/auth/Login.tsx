import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import { useLoginMutation } from "./authApi";
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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();

  const from = (location.state as { from?: string } | null)?.from || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      await login({ email, password }).unwrap();
      // Recarrega para que SessionBootstrap busque a sessão enriquecida (roles/permissões)
      window.location.assign(from);
    } catch (err) {
      const error = err as { data?: string; message?: string };
      setErrorMsg(error.data || error.message || "Falha no login.");
      toast.error(error.data || error.message || "Falha na autenticação.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <div className="mb-2 text-center">
            <p className="text-lg font-bold tracking-tight">Luana Rohr</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Art · Camisetas
            </p>
          </div>
          <CardTitle className="text-2xl text-center">Entrar</CardTitle>
          <CardDescription className="text-center">
            Acesse sua conta para acompanhar seus pedidos
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                name="email"
                data-testid="login-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Senha</Label>
              <Input
                id="login-password"
                name="password"
                data-testid="login-password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {errorMsg && (
              <p
                className="text-sm text-red-600 bg-red-50 p-2 rounded"
                data-testid="login-error"
              >
                {errorMsg}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="login-submit"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
            <div className="text-sm text-center space-y-2">
              <p>
                Não tem uma conta?{" "}
                <Link
                  to="/register"
                  className="font-medium text-primary hover:underline"
                  data-testid="login-register-link"
                >
                  Cadastre-se
                </Link>
              </p>
              <p>
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary hover:underline"
                  data-testid="login-forgot-password-link"
                >
                  Esqueci minha senha
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
