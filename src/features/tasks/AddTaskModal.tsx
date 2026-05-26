import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, FileText, Link as LinkIcon, ListChecks, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { CREATE_ORGANIZATION_OPTION, CREATE_PROJECT_OPTION } from "../../lib/constants";
import { isSupabaseConfigured } from "../../lib/supabase";
import { addTaskSchema, type AddTaskFormValues } from "../../lib/validators";
import { useZenflowStore } from "../../state/zenflow-store";
import type { Priority } from "../../types/domain";
import { loadOrSeedWorkspace } from "../workspace/workspace-sync.service";
import { createTaskWithSubtasks } from "./services/tasks.service";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DraftSubtask {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  priority: Priority;
}

const emptyDraftSubtask = (): DraftSubtask => ({
  id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title: "",
  description: "",
  estimatedHours: 1,
  priority: "medium",
});

export function AddTaskModal({ isOpen, onClose }: AddTaskModalProps) {
  const [taskType, setTaskType] = useState<"simple" | "complex">("simple");
  const [error, setError] = useState<string | null>(null);
  const [draftSubtasks, setDraftSubtasks] = useState<DraftSubtask[]>([emptyDraftSubtask()]);
  const storeOrganizations = useZenflowStore((state) => state.organizations);
  const storeProjects = useZenflowStore((state) => state.projects);
  const createTask = useZenflowStore((state) => state.createTask);
  const hydrateWorkspace = useZenflowStore((state) => state.hydrateWorkspace);
  const { register, handleSubmit, watch } = useForm<AddTaskFormValues>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "simple",
      priority: "medium",
    },
  });
  const selectedOrganization = watch("organizationId");
  const scopedProjects = storeProjects.filter((project) => !selectedOrganization || project.organizationId === selectedOrganization);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setDraftSubtasks([emptyDraftSubtask()]);
  }, [isOpen]);

  async function submitMockTask(values: AddTaskFormValues) {
    const organizationId = values.organizationId === CREATE_ORGANIZATION_OPTION ? "" : values.organizationId;
    const projectId = values.projectId === CREATE_PROJECT_OPTION ? "" : values.projectId;
    const subtaskInput = taskType === "complex"
      ? draftSubtasks.map((subtask) => ({
        title: subtask.title.trim(),
        description: subtask.description.trim() || undefined,
        estimatedHours: Number(subtask.estimatedHours),
        priority: subtask.priority,
      }))
      : undefined;

    if (taskType === "complex") {
      if (!organizationId || !projectId || !values.dueDate) {
        setError("Una tarea compleja requiere organizacion, proyecto y fecha.");
        return;
      }
      if (!subtaskInput?.length || subtaskInput.some((subtask) => !subtask.title || subtask.estimatedHours <= 0)) {
        setError("Agrega al menos una subtarea con titulo y horas estimadas mayores a 0.");
        return;
      }
    }

    if (isSupabaseConfigured) {
      const result = await createTaskWithSubtasks({
        title: values.title,
        description: values.description,
        type: taskType,
        organizationId: organizationId || undefined,
        projectId: projectId || undefined,
        dueDate: values.dueDate || undefined,
        priority: values.priority,
        subtasks: subtaskInput,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      const snapshot = await loadOrSeedWorkspace();
      if (snapshot) hydrateWorkspace(snapshot);
      setError(null);
      onClose();
      return;
    }

    const result = createTask({
      title: values.title,
      description: values.description,
      type: taskType,
      organizationId: organizationId || undefined,
      projectId: projectId || undefined,
      dueDate: values.dueDate || undefined,
      priority: values.priority,
      subtasks: subtaskInput,
    });
    if (!result.ok) {
      setError(result.message ?? "No se pudo crear la tarea.");
      return;
    }
    setError(null);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar nueva tarea"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="secondary">Guardar borrador</Button>
          <Button type="button" onClick={handleSubmit(submitMockTask)}>Crear tarea</Button>
        </div>
      }
    >
      <form className="space-y-8">
        {error ? <div className="rounded-lg bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">{error}</div> : null}
        <section className="space-y-4">
          <SectionTitle icon={<FileText className="h-5 w-5" />} label="Informacion basica" />
          <Input placeholder="Titulo de la tarea" {...register("title")} />
          <Textarea placeholder="Descripcion corta" {...register("description")} />
          <div className="grid gap-3 md:grid-cols-2">
            {(["simple", "complex"] as const).map((type) => (
              <label
                key={type}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-primary/50 ${
                  taskType === type ? "border-primary bg-primary/5" : "border-outline-variant bg-surface"
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  value={type}
                  {...register("type")}
                  onChange={() => setTaskType(type)}
                />
                <div className="mb-2 flex items-center gap-3 font-semibold">
                  <ListChecks className="h-5 w-5 text-primary" />
                  {type === "simple" ? "Card sencilla" : "Card compleja con subtareas"}
                </div>
                <p className="text-sm text-on-surface-variant">
                  {type === "simple" ? "Rapida, flexible y puede existir sin planeacion completa." : "Requiere organizacion, proyecto, vencimiento y subtareas estimadas."}
                </p>
              </label>
            ))}
          </div>
          <p className="text-xs italic text-on-surface-variant">El tipo de card no se puede cambiar despues de creada.</p>
        </section>

        <section className="space-y-4 border-t border-outline-variant pt-6">
          <SectionTitle icon={<Briefcase className="h-5 w-5" />} label="Organizacion y proyecto" />
          <div className="rounded-lg bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
            Antes de crear una tarea necesitas crear o seleccionar una organizacion para una tarea completa.
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Select {...register("organizationId")}>
              <option value="">Selecciona una organizacion</option>
              {storeOrganizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
              <option value={CREATE_ORGANIZATION_OPTION}>+ Crear nueva organizacion</option>
            </Select>
            <Select {...register("projectId")}>
              <option value="">Selecciona un proyecto</option>
              {scopedProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
              <option value={CREATE_PROJECT_OPTION}>+ Crear nuevo proyecto</option>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2 rounded-lg border border-outline-variant bg-surface p-2">
            {["UI/UX", "MVP"].map((tag) => (
              <Badge key={tag} tone="primary">
                {tag}
              </Badge>
            ))}
            <input className="min-w-32 flex-1 bg-transparent px-2 text-sm outline-none" placeholder="Anadir tag..." />
          </div>
        </section>

        <section className="space-y-4 border-t border-outline-variant pt-6">
          <SectionTitle icon={<ListChecks className="h-5 w-5" />} label="Planificacion" />
          <div className="grid gap-4 md:grid-cols-3">
            <Input type="date" {...register("dueDate")} />
            <Select {...register("priority")}>
              <option value="urgent">Urgente</option>
              <option value="medium">Intermedia</option>
              <option value="low">Baja</option>
            </Select>
            <Input type="number" min={1} placeholder="Horas estimadas" />
          </div>
        </section>

        {taskType === "complex" ? (
          <section className="space-y-4 border-t border-outline-variant pt-6">
            <div className="flex items-center justify-between">
              <SectionTitle icon={<ListChecks className="h-5 w-5" />} label="Subtareas" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setDraftSubtasks((current) => [...current, emptyDraftSubtask()])}
              >
                Agregar subtarea
              </Button>
            </div>
            {draftSubtasks.map((subtask, index) => (
              <div key={subtask.id} className="grid grid-cols-12 items-center gap-3 rounded-xl border border-outline-variant bg-surface p-4">
                <div className="col-span-12 md:col-span-5">
                  <Input
                    value={subtask.title}
                    placeholder={`Subtarea ${index + 1}`}
                    onChange={(event) => setDraftSubtasks((current) => current.map((item) => (item.id === subtask.id ? { ...item, title: event.target.value } : item)))}
                  />
                  <Input
                    className="mt-2"
                    value={subtask.description}
                    placeholder="Descripcion opcional"
                    onChange={(event) => setDraftSubtasks((current) => current.map((item) => (item.id === subtask.id ? { ...item, description: event.target.value } : item)))}
                  />
                </div>
                <div className="col-span-6 md:col-span-3">
                  <Select
                    value={subtask.priority}
                    onChange={(event) => setDraftSubtasks((current) => current.map((item) => (item.id === subtask.id ? { ...item, priority: event.target.value as Priority } : item)))}
                  >
                    <option value="urgent">Urgente</option>
                    <option value="medium">Intermedia</option>
                    <option value="low">Baja</option>
                  </Select>
                </div>
                <div className="col-span-4 md:col-span-3">
                  <Input
                    type="number"
                    min={0.25}
                    step={0.25}
                    value={subtask.estimatedHours}
                    onChange={(event) => setDraftSubtasks((current) => current.map((item) => (item.id === subtask.id ? { ...item, estimatedHours: Number(event.target.value) } : item)))}
                  />
                </div>
                <div className="col-span-2 flex justify-end md:col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={draftSubtasks.length === 1}
                    onClick={() => setDraftSubtasks((current) => current.filter((item) => item.id !== subtask.id))}
                    aria-label="Eliminar subtarea"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </section>
        ) : null}

        <section className="space-y-4 border-t border-outline-variant pt-6">
          <SectionTitle icon={<LinkIcon className="h-5 w-5" />} label="Espacio de trabajo" />
          <Input placeholder="https:// link de referencia" />
          <Textarea placeholder="Notas y recursos..." />
        </section>
      </form>
    </Modal>
  );
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-primary">
      {icon}
      <h3 className="text-lg font-semibold">{label}</h3>
    </div>
  );
}
