import { ArrowRightLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { isSupabaseConfigured } from "../../lib/supabase";
import { useZenflowStore } from "../../state/zenflow-store";
import type { Project } from "../../types/domain";
import { createProject as createRemoteProject, deleteProject as deleteRemoteProject, listProjects, moveProjectToOrganization as moveRemoteProjectToOrganization, updateProject as updateRemoteProject } from "./services/projects.service";

type ProjectView = Project | { id: string; organizationId?: string; organization_id?: string; name: string; description?: string | null; color: string; tags?: string[] };

export function ProjectsPage() {
  const organizations = useZenflowStore((state) => state.organizations);
  const projects = useZenflowStore((state) => state.projects);
  const tasks = useZenflowStore((state) => state.tasks);
  const filters = useZenflowStore((state) => state.filters);
  const createProject = useZenflowStore((state) => state.createProject);
  const updateProject = useZenflowStore((state) => state.updateProject);
  const moveProjectOrganization = useZenflowStore((state) => state.moveProjectOrganization);
  const deleteProject = useZenflowStore((state) => state.deleteProject);
  const [remoteProjects, setRemoteProjects] = useState<ProjectView[] | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectView | null>(null);
  const [movingProject, setMovingProject] = useState<ProjectView | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const searchQuery = filters.searchQuery.trim().toLowerCase();
  const sourceProjects = remoteProjects ?? projects;
  const visibleProjects = sourceProjects.filter((project) => {
    if (filters.organizationId !== "all" && getProjectOrganizationId(project) !== filters.organizationId) return false;
    if (filters.projectId !== "all" && project.id !== filters.projectId) return false;
    if (searchQuery && !`${project.name} ${project.description ?? ""} ${(project.tags ?? []).join(" ")}`.toLowerCase().includes(searchQuery)) return false;
    return true;
  });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    listProjects().then((result) => {
      if (result.data) setRemoteProjects(result.data.map((project) => ({ ...project, organizationId: project.organization_id, tags: [] })));
      if (result.error) setMessage(result.error);
    });
  }, []);

  async function handleDelete(project: ProjectView) {
    if (!window.confirm(`Eliminar "${project.name}"?`)) return;
    if (isSupabaseConfigured) {
      const result = await deleteRemoteProject(project.id);
      if (result.error) setMessage(result.error);
      else setRemoteProjects((current) => current?.filter((item) => item.id !== project.id) ?? null);
      return;
    }
    const result = deleteProject(project.id);
    if (!result.ok) setMessage(result.message ?? "No se pudo eliminar el proyecto.");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-bold">Proyectos</h1>
          <p className="mt-1 text-on-surface-variant">Un proyecto puede moverse de organizacion, pero sus cards no cambian de proyecto.</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setIsCreating(true)}>Crear proyecto</Button>
      </header>
      {message ? (
        <button className="w-full rounded-lg bg-error-container px-4 py-3 text-left text-sm font-medium text-on-error-container" onClick={() => setMessage(null)}>
          {message}
        </button>
      ) : null}
      <section className="grid gap-5">
        {visibleProjects.map((project) => {
          const organization = organizations.find((item) => item.id === getProjectOrganizationId(project));
          const projectTasks = tasks.filter((task) => task.projectId === project.id && !task.deletedAt);
          const estimated = projectTasks.reduce((total, task) => total + task.estimatedHours, 0);
          const real = projectTasks.reduce((total, task) => total + task.realHours, 0);
          const progress = projectTasks.length ? Math.round(projectTasks.reduce((total, task) => total + task.progress, 0) / projectTasks.length) : 0;
          return (
            <Card key={project.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <span className="h-12 w-2 rounded-full" style={{ background: project.color }} />
                  <div>
                    <h2 className="text-xl font-semibold">{project.name}</h2>
                    <p className="text-sm text-on-surface-variant">{organization?.name}</p>
                    <div className="mt-2 flex gap-2">
                      {(project.tags ?? []).map((tag) => <Badge key={tag}>{tag}</Badge>)}
                    </div>
                  </div>
                </div>
                <div className="grid min-w-80 grid-cols-3 gap-3 text-sm">
                  <Stat label="Activas" value={projectTasks.filter((task) => task.status !== "done").length} />
                  <Stat label="Terminadas" value={projectTasks.filter((task) => task.status === "done").length} />
                  <Stat label="Horas" value={`${real}/${estimated}`} />
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center">
                <ProgressBar value={progress} className="flex-1" />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditingProject(project)}>Editar</Button>
                  <Button variant="outline" size="sm" icon={<ArrowRightLeft className="h-4 w-4" />} onClick={() => setMovingProject(project)}>Mover organizacion</Button>
                  <Button variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => handleDelete(project)}>Eliminar</Button>
                </div>
              </div>
            </Card>
          );
        })}
      </section>
      <ProjectModal
        isOpen={isCreating || Boolean(editingProject)}
        project={editingProject}
        organizations={organizations}
        onClose={() => {
          setIsCreating(false);
          setEditingProject(null);
        }}
        onSave={async (input) => {
          if (isSupabaseConfigured) {
            const result = editingProject
              ? await updateRemoteProject(editingProject.id, { name: input.name, description: input.description, color: input.color })
              : await createRemoteProject({ organizationId: input.organizationId, name: input.name, description: input.description, color: input.color });
            if (result.error) setMessage(result.error);
            else if (result.data) setRemoteProjects((current) => editingProject ? (current ?? []).map((item) => item.id === result.data.id ? { ...result.data, organizationId: result.data.organization_id, tags: [] } : item) : [{ ...result.data, organizationId: result.data.organization_id, tags: [] }, ...(current ?? [])]);
          } else if (editingProject) updateProject(editingProject.id, input);
          else createProject(input);
          setIsCreating(false);
          setEditingProject(null);
        }}
      />
      <MoveProjectModal
        project={movingProject}
        organizations={organizations}
        onClose={() => setMovingProject(null)}
        onMove={async (organizationId) => {
          if (movingProject && window.confirm("Este proyecto y sus tareas se moveran a la nueva organizacion.")) {
            if (isSupabaseConfigured) {
              const result = await moveRemoteProjectToOrganization(movingProject.id, organizationId);
              if (result.error) setMessage(result.error);
              else if (result.data) setRemoteProjects((current) => (current ?? []).map((item) => item.id === result.data.id ? { ...result.data, organizationId: result.data.organization_id, tags: [] } : item));
            } else {
              moveProjectOrganization(movingProject.id, organizationId);
            }
          }
          setMovingProject(null);
        }}
      />
    </div>
  );
}

function ProjectModal({
  isOpen,
  project,
  organizations,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  project: ProjectView | null;
  organizations: ProjectPageOrganization[];
  onClose: () => void;
  onSave: (input: Pick<Project, "name" | "description" | "organizationId" | "color" | "tags">) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [color, setColor] = useState("#10a37f");
  const [tags, setTags] = useState("");

  useEffect(() => {
    setName(project?.name ?? "");
    setDescription(project?.description ?? "");
    setOrganizationId(getProjectOrganizationId(project) ?? organizations[0]?.id ?? "");
    setColor(project?.color ?? "#10a37f");
    setTags(project?.tags?.join(", ") ?? "");
  }, [project, organizations, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      title={project ? "Editar proyecto" : "Crear proyecto"}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!name.trim() || !organizationId} onClick={() => onSave({ name, description, organizationId, color, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) })}>Guardar</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input value={name} placeholder="Nombre" onChange={(event) => setName(event.target.value)} />
        <Textarea value={description} placeholder="Descripcion" onChange={(event) => setDescription(event.target.value)} />
        <Select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
          {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
        </Select>
        <Input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
        <Input value={tags} placeholder="Tags separados por coma" onChange={(event) => setTags(event.target.value)} />
      </div>
    </Modal>
  );
}

type ProjectPageOrganization = { id: string; name: string };

function MoveProjectModal({ project, organizations, onClose, onMove }: { project: ProjectView | null; organizations: ProjectPageOrganization[]; onClose: () => void; onMove: (organizationId: string) => void }) {
  const [organizationId, setOrganizationId] = useState("");

  useEffect(() => {
    setOrganizationId(getProjectOrganizationId(project) ?? "");
  }, [project]);

  return (
    <Modal
      isOpen={Boolean(project)}
      title="Mover proyecto de organizacion"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!organizationId || organizationId === getProjectOrganizationId(project)} onClick={() => onMove(organizationId)}>Mover</Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-on-surface-variant">El proyecto y todas sus tareas cambiaran de organizacion.</p>
      <Select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
        {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
      </Select>
    </Modal>
  );
}

function getProjectOrganizationId(project: ProjectView | null | undefined) {
  if (!project) return undefined;
  if ("organizationId" in project && project.organizationId) return project.organizationId;
  if ("organization_id" in project) return project.organization_id;
  return undefined;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-surface-container-low p-3">
      <p className="text-xs text-on-surface-variant">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}
