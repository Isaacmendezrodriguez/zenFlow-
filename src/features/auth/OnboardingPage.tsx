import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { isSupabaseConfigured } from "../../lib/supabase";
import { useZenflowStore } from "../../state/zenflow-store";
import { createOrganization as createRemoteOrganization } from "../organizations/services/organizations.service";
import { loadOrSeedWorkspace } from "../workspace/workspace-sync.service";

export function OnboardingPage() {
  const navigate = useNavigate();
  const createMockOrganization = useZenflowStore((state) => state.createOrganization);
  const hydrateWorkspace = useZenflowStore((state) => state.hydrateWorkspace);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    if (!isSupabaseConfigured) {
      createMockOrganization({ name, description });
      navigate("/dashboard");
      return;
    }
    const result = await createRemoteOrganization({ name, description });
    if (result.error) setMessage(result.error);
    else {
      const snapshot = await loadOrSeedWorkspace();
      if (snapshot) hydrateWorkspace(snapshot);
      navigate("/dashboard");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-xl p-8">
        <h1 className="text-3xl font-bold text-on-background">Bienvenido a ZenFlow</h1>
        <p className="mt-2 text-on-surface-variant">Crea tu primera organizacion para empezar.</p>
        {message ? <button className="mt-4 w-full rounded-lg bg-error-container p-3 text-left text-sm text-on-error-container" onClick={() => setMessage(null)}>{message}</button> : null}
        <div className="mt-8 space-y-4">
          <Input placeholder="Nombre de la organizacion" value={name} onChange={(event) => setName(event.target.value)} />
          <Textarea placeholder="Descripcion opcional" value={description} onChange={(event) => setDescription(event.target.value)} />
          <div className="flex justify-end gap-3">
            <Link className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface px-4 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low" to="/dashboard">
              Omitir por ahora
            </Link>
            <Button disabled={!name.trim()} onClick={handleCreate}>Crear organizacion</Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
