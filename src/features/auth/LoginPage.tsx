import { useNavigate } from "react-router-dom";
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
  const [isSubmitting, setSubmitting] = useState(false);

  function validateForm() {
    if (!email.trim()) return "Escribe tu correo.";
    if (password.length < 6) return "La contrasena debe tener al menos 6 caracteres.";
    return null;
  }

  async function handleSignIn() {
    navigate("/dashboard");
  }

  async function handleSignUp() {
    const validationMessage = validateForm();
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }
    if (!isSupabaseConfigured) {
      navigate("/onboarding");
      return;
    }
    setSubmitting(true);
    const result = await signUp(email, password);
    setSubmitting(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    if (result.data?.session) {
      navigate("/onboarding");
      return;
    }
    setMessage("Cuenta creada. Revisa tu correo y confirma el enlace antes de entrar.");
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
          <Button className="w-full" onClick={handleSignIn} disabled={isSubmitting}>
            Entrar a ZenFlow
          </Button>
          <button className="block w-full text-center text-sm font-semibold text-primary hover:underline disabled:opacity-60" onClick={handleSignUp} disabled={isSubmitting}>
            Crear usuario Supabase y configurar organizacion
          </button>
          <p className="text-center text-xs text-on-surface-variant">Uso personal: puedes entrar sin iniciar sesion.</p>
        </div>
      </Card>
    </main>
  );
}
