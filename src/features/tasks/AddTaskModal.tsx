import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, FileText, Link as LinkIcon, ListChecks, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { CREATE_ORGANIZATION_OPTION, CREATE_PROJECT_OPTION } from "../../lib/constants";
import { addTaskSchema, type AddTaskFormValues } from "../../lib/validators";
import { organizations, projects, subtasks } from "../../mocks/mock-data";
import { useZenflowStore } from "../../state/zenflow-store";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTaskModal({ isOpen, onClose }: AddTaskModalProps) {
  const [taskType, setTaskType] = useState<"simple" | "complex">("simple");
  const [error, setError] = useState<string | null>(null);
  const storeOrganizations = useZenflowStore((state) => state.organizations);
  const storeProjects = useZenflowStore((state) => state.projects);
  const createTask = useZenflowStore((state) => state.createTask);
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

  function submitMockTask(values: AddTaskFormValues) {
    const result = createTask({
      title: values.title,
      description: values.description,
      type: taskType,
      organizationId: values.organizationId || undefined,
      projectId: values.projectId || undefined,
      dueDate: values.dueDate || undefined,
      priority: values.priority,
      subtasks: taskType === "complex" ? subtasks.slice(0, 2).map((subtask) => ({ title: subtask.title, description: subtask.description, estimatedHours: subtask.estimatedHours, priority: subtask.priority })) : undefined,
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
          <Button variant="secondary">Guardar borrador</Button>
          <Button onClick={handleSubmit(submitMockTask)}>Crear tarea</Button>
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
              <Button variant="ghost" size="sm" icon={<Plus className="h-4 w-4" />}>
                Agregar subtarea
              </Button>
            </div>
            {subtasks.slice(0, 2).map((subtask) => (
              <div key={subtask.id} className="grid grid-cols-12 items-center gap-3 rounded-xl border border-outline-variant bg-surface p-4">
                <div className="col-span-6">
                  <p className="font-semibold">{subtask.title}</p>
                  <p className="text-xs text-on-surface-variant">{subtask.description}</p>
                </div>
                <div className="col-span-3">
                  <Badge tone={subtask.priority === "urgent" ? "error" : "neutral"}>{subtask.priority}</Badge>
                </div>
                <div className="col-span-3 text-right text-sm font-semibold">{subtask.estimatedHours}h</div>
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
