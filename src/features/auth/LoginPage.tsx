import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { isSupabaseConfigured } from "../../lib/supabase";
import { signIn, signUp } from "./services/auth.service";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignIn() {
    if (!isSupabaseConfigured) {
      navigate("/dashboard");
      return;
    }
    const result = await signIn(email, password);
    if (result.error) setMessage(result.error);
    else navigate("/dashboard");
  }

  async function handleSignUp() {
    if (!isSupabaseConfigured) {
      navigate("/onboarding");
      return;
    }
    const result = await signUp(email, password);
    if (result.error) setMessage(result.error);
    else navigate("/onboarding");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">ZenFlow</h1>
          <p className="mt-2 text-on-surface-variant">Entra a tu espacio personal de productividad.</p>
        </div>
        {!isSupabaseConfigured ? (
          <div className="mb-4 rounded-lg border border-outline-variant bg-surface-container-low p-3 text-sm text-on-surface-variant">
            Supabase no esta configurado. Se usara la sesion mock de desarrollo.
          </div>
        ) : null}
        {message ? <button className="mb-4 w-full rounded-lg bg-error-container p-3 text-left text-sm text-on-error-container" onClick={() => setMessage(null)}>{message}</button> : null}
        <div className="space-y-4">
          <Input type="email" placeholder="correo@ejemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input type="password" placeholder="Contrasena" value={password} onChange={(event) => setPassword(event.target.value)} />
          <Button className="w-full" onClick={handleSignIn}>
            {isSupabaseConfigured ? "Entrar" : "Entrar con mock session"}
          </Button>
          <button className="block w-full text-center text-sm font-semibold text-primary hover:underline" onClick={handleSignUp}>
            Crear cuenta y configurar organizacion
          </button>
          <Link className="block text-center text-xs text-on-surface-variant hover:text-primary" to="/dashboard">Continuar al prototipo mock</Link>
        </div>
      </Card>
    </main>
  );
}
