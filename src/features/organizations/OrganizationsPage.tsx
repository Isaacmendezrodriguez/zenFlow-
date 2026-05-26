import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Textarea } from "../../components/ui/Textarea";
import { isSupabaseConfigured } from "../../lib/supabase";
import { useZenflowStore } from "../../state/zenflow-store";
import { createOrganization as createRemoteOrganization, deleteOrganization as deleteRemoteOrganization, listOrganizations, updateOrganization as updateRemoteOrganization } from "./services/organizations.service";
import { loadOrSeedWorkspace } from "../workspace/workspace-sync.service";

type OrganizationView = { id: string; name: string; description?: string | null };

export function OrganizationsPage() {
  const organizations = useZenflowStore((state) => state.organizations);
  const projects = useZenflowStore((state) => state.projects);
  const tasks = useZenflowStore((state) => state.tasks);
  const filters = useZenflowStore((state) => state.filters);
  const createOrganization = useZenflowStore((state) => state.createOrganization);
  const updateOrganization = useZenflowStore((state) => state.updateOrganization);
  const deleteOrganization = useZenflowStore((state) => state.deleteOrganization);
  const hydrateWorkspace = useZenflowStore((state) => state.hydrateWorkspace);
  const [editingOrganization, setEditingOrganization] = useState<OrganizationView | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const searchQuery = filters.searchQuery.trim().toLowerCase();
  const sourceOrganizations: OrganizationView[] = organizations;
  const visibleOrganizations = sourceOrganizations.filter((organization) => {
    if (filters.organizationId !== "all" && organization.id !== filters.organizationId) return false;
    if (searchQuery && !`${organization.name} ${organization.description ?? ""}`.toLowerCase().includes(searchQuery)) return false;
    return true;
  });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    listOrganizations().then(async (result) => {
      if (result.data?.length) {
        const snapshot = await loadOrSeedWorkspace();
        if (snapshot) hydrateWorkspace(snapshot);
      }
      if (result.error) setMessage(result.error);
    });
  }, [hydrateWorkspace]);

  async function refreshWorkspace() {
    const snapshot = await loadOrSeedWorkspace();
    if (snapshot) hydrateWorkspace(snapshot);
  }

  async function handleDelete(organization: OrganizationView) {
    if (!window.confirm(`Eliminar "${organization.name}"?`)) return;
    if (isSupabaseConfigured) {
      const result = await deleteRemoteOrganization(organization.id);
      if (result.error) setMessage(result.error);
      else await refreshWorkspace();
      return;
    }
    const result = deleteOrganization(organization.id);
    if (!result.ok) setMessage(result.message ?? "No se pudo eliminar la organizacion.");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-bold">Organizaciones</h1>
          <p className="mt-1 text-on-surface-variant">Cada tarea completa debe pertenecer a una organizacion y proyecto.</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setIsCreating(true)}>Crear organizacion</Button>
      </header>
      {message ? (
        <button className="w-full rounded-lg bg-error-container px-4 py-3 text-left text-sm font-medium text-on-error-container" onClick={() => setMessage(null)}>
          {message}
        </button>
      ) : null}
      <section className="grid gap-6 lg:grid-cols-3">
        {visibleOrganizations.map((organization) => {
          const orgProjects = projects.filter((project) => project.organizationId === organization.id);
          const orgTasks = tasks.filter((task) => task.organizationId === organization.id && !task.deletedAt);
          const completed = orgTasks.filter((task) => task.status === "done").length;
          const progress = orgTasks.length ? Math.round((completed / orgTasks.length) * 100) : 0;
          return (
            <Card key={organization.id} className="p-6">
              <div className="mb-5 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <Badge>{orgProjects.length} proyectos</Badge>
              </div>
              <h2 className="text-xl font-semibold">{organization.name}</h2>
              <p className="mt-2 min-h-10 text-sm text-on-surface-variant">{organization.description}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Stat label="Activas" value={orgTasks.length - completed} />
                <Stat label="Terminadas" value={completed} />
              </div>
              <ProgressBar className="mt-4" value={progress} />
              <div className="mt-5 flex gap-2">
                <Button variant="outline" size="sm" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditingOrganization(organization)}>Editar</Button>
                <Button variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => handleDelete(organization)}>Eliminar</Button>
              </div>
            </Card>
          );
        })}
      </section>
      <OrganizationModal
        isOpen={isCreating || Boolean(editingOrganization)}
        organization={editingOrganization}
        onClose={() => {
          setIsCreating(false);
          setEditingOrganization(null);
        }}
        onSave={async (input) => {
          if (isSupabaseConfigured) {
            const result = editingOrganization ? await updateRemoteOrganization(editingOrganization.id, input) : await createRemoteOrganization(input);
            if (result.error) setMessage(result.error);
            else await refreshWorkspace();
          } else if (editingOrganization) updateOrganization(editingOrganization.id, { name: input.name, description: input.description ?? undefined });
          else createOrganization({ name: input.name, description: input.description ?? undefined });
          setIsCreating(false);
          setEditingOrganization(null);
        }}
      />
    </div>
  );
}

function OrganizationModal({
  isOpen,
  organization,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  organization: OrganizationView | null;
  onClose: () => void;
  onSave: (input: { name: string; description?: string | null }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setName(organization?.name ?? "");
    setDescription(organization?.description ?? "");
  }, [organization, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      title={organization ? "Editar organizacion" : "Crear organizacion"}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!name.trim()} onClick={() => onSave({ name, description })}>Guardar</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input value={name} placeholder="Nombre" onChange={(event) => setName(event.target.value)} />
        <Textarea value={description} placeholder="Descripcion" onChange={(event) => setDescription(event.target.value)} />
      </div>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-surface-container-low p-3">
      <p className="text-on-surface-variant">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
