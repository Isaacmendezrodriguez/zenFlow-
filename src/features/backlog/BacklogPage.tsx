import { Eye, Link as LinkIcon, MoreHorizontal, Pencil, Save, SlidersHorizontal, Timer, X } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Tabs } from "../../components/ui/Tabs";
import { BASE_STATUSES, OPTIONAL_STATUSES, PRIORITY_LABELS, STATUS_LABELS, TASK_STATUSES, TASK_STATUS_INDEX } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { useZenflowStore } from "../../state/zenflow-store";
import type { Priority, Subtask, Task, TaskStatus } from "../../types/domain";
import { EditTaskModal } from "../tasks/EditTaskModal";

const priorityTone: Record<Priority, "error" | "tertiary" | "secondary"> = {
  urgent: "error",
  medium: "tertiary",
  low: "secondary",
};

type BacklogDialog =
  | { type: "message"; title: string; message: string }
  | { type: "progress"; task: Task; targetStatus: TaskStatus; subtaskId: string; realHours: number }
  | { type: "complete"; task: Task; targetStatus: TaskStatus }
  | { type: "delete"; task: Task };

type PendingMove = {
  taskId: string;
  targetStatus: TaskStatus;
  subtaskId?: string;
  realHours?: number;
  forceCompleteSubtasks?: boolean;
};

export function BacklogPage() {
  const [view, setView] = useState("expanded");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<BacklogDialog | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [pendingMoves, setPendingMoves] = useState<PendingMove[]>([]);
  const [isSavingMoves, setIsSavingMoves] = useState(false);
  const userSettings = useZenflowStore((state) => state.userSettings);
  const filters = useZenflowStore((state) => state.filters);
  const updateFilters = useZenflowStore((state) => state.updateFilters);
  const resetFilters = useZenflowStore((state) => state.resetFilters);
  const organizations = useZenflowStore((state) => state.organizations);
  const projects = useZenflowStore((state) => state.projects);
  const tasks = useZenflowStore((state) => state.tasks);
  const moveTask = useZenflowStore((state) => state.moveTask);
  const syncWorkspace = useZenflowStore((state) => state.syncWorkspace);
  const completeSubtask = useZenflowStore((state) => state.completeSubtask);
  const archiveTask = useZenflowStore((state) => state.archiveTask);
  const deleteTask = useZenflowStore((state) => state.deleteTask);
  const subtasks = useZenflowStore((state) => state.subtasks);
  const effectiveView = userSettings.backlogView === "compact" ? "compact" : view;
  const scopedProjects = projects.filter((project) => filters.organizationId === "all" || project.organizationId === filters.organizationId);
  const searchQuery = filters.searchQuery.trim().toLowerCase();
  const pendingByTask = new Map(pendingMoves.map((move) => [move.taskId, move]));
  const tasksWithPendingStatus = tasks.map((task) => {
    const pending = pendingByTask.get(task.id);
    return pending ? { ...task, status: pending.targetStatus, statusIndex: TASK_STATUS_INDEX[pending.targetStatus], progress: getPreviewProgress(task, pending.targetStatus) } : task;
  });
  const filteredTasks = tasksWithPendingStatus.filter((task) => {
    if (filters.organizationId !== "all" && task.organizationId !== filters.organizationId) return false;
    if (filters.projectId !== "all" && task.projectId !== filters.projectId) return false;
    if (filters.status !== "all" && (TASK_STATUSES as readonly string[]).includes(filters.status) && task.status !== filters.status) return false;
    if (searchQuery && !`${task.title} ${task.description}`.toLowerCase().includes(searchQuery)) return false;
    return true;
  });
  const allStatuses: TaskStatus[] = [
    ...BASE_STATUSES,
    ...(userSettings.enableReviewColumn ? ["review" as const] : []),
    ...(userSettings.enableBlockedColumn ? ["blocked" as const] : []),
    ...(userSettings.enableWaitingColumn ? ["waiting" as const] : []),
  ];
  const statuses = filters.status !== "all" && (TASK_STATUSES as readonly string[]).includes(filters.status)
    ? allStatuses.filter((status) => status === filters.status)
    : allStatuses;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-bold">Backlog Kanban</h1>
          <p className="mt-1 text-on-surface-variant">Agrupado por organizacion y proyecto, con prioridad y progreso.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setShowFilters((value) => !value)} aria-label="Mostrar filtros">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <Tabs
            value={view}
            onChange={setView}
            items={[
              { label: "Expanded", value: "expanded" },
              { label: "Compact", value: "compact" },
              { label: "Map", value: "map" },
            ]}
          />
        </div>
      </div>

      <div className={cn("mb-4 grid gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 transition-all sm:grid-cols-[1fr_1fr_1fr_auto]", showFilters ? "max-h-40 py-3 opacity-100" : "max-h-0 overflow-hidden border-transparent py-0 opacity-0")}>
        <Select value={filters.organizationId} onChange={(event) => updateFilters({ organizationId: event.target.value })}>
          <option value="all">Todas las organizaciones</option>
          {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
        </Select>
        <Select value={filters.projectId} onChange={(event) => updateFilters({ projectId: event.target.value })}>
          <option value="all">Todos los proyectos</option>
          {scopedProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </Select>
        <Select value={(TASK_STATUSES as readonly string[]).includes(filters.status) ? filters.status : "all"} onChange={(event) => updateFilters({ status: event.target.value as TaskStatus | "all" })}>
          <option value="all">Todos los estados</option>
          {TASK_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
        </Select>
        <Button variant="outline" onClick={resetFilters}>Limpiar</Button>
      </div>

      {pendingMoves.length ? (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-on-surface sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">{pendingMoves.length} cambio{pendingMoves.length === 1 ? "" : "s"} pendiente{pendingMoves.length === 1 ? "" : "s"} de guardar</p>
            <p className="text-xs text-on-surface-variant">El backlog ya refleja el movimiento. Presiona Guardar cambios para sincronizarlo con Supabase.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" icon={<X className="h-4 w-4" />} disabled={isSavingMoves} onClick={() => setPendingMoves([])}>
              Descartar
            </Button>
            <Button icon={<Save className="h-4 w-4" />} disabled={isSavingMoves} onClick={() => savePendingMoves(pendingMoves, tasks, completeSubtask, moveTask, syncWorkspace, setPendingMoves, setDialog, setIsSavingMoves)}>
              {isSavingMoves ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
        {statuses.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            compact={effectiveView === "compact"}
            tasks={filteredTasks}
            draggingTaskId={draggingTaskId}
            onDragStart={setDraggingTaskId}
            onDropTask={(targetStatus) => {
              const task = filteredTasks.find((item) => item.id === draggingTaskId);
              setDraggingTaskId(null);
              if (!task) return;
              const originalTask = tasks.find((item) => item.id === task.id) ?? task;
              handleMoveTask(originalTask, targetStatus, subtasks, setDialog, setPendingMoves);
            }}
            onEdit={setEditingTask}
            onArchive={(task) => {
              const result = archiveTask(task.id);
              if (!result.ok) setDialog({ type: "message", title: "No se puede archivar", message: result.message ?? "No se pudo archivar esta tarea." });
            }}
            onDelete={(task) => {
              setDialog({ type: "delete", task });
            }}
            pendingTaskIds={new Set(pendingMoves.map((move) => move.taskId))}
          />
        ))}
      </div>
      <EditTaskModal isOpen={Boolean(editingTask)} task={editingTask} onClose={() => setEditingTask(null)} />
      <BacklogDialogModal
        dialog={dialog}
        subtasks={subtasks}
        onClose={() => setDialog(null)}
        onConfirmProgress={(payload) => {
          stagePendingMove(setPendingMoves, { taskId: payload.task.id, targetStatus: payload.targetStatus, subtaskId: payload.subtaskId, realHours: payload.realHours });
          setDialog(null);
        }}
        onConfirmComplete={(task, targetStatus) => {
          stagePendingMove(setPendingMoves, { taskId: task.id, targetStatus, forceCompleteSubtasks: true });
          setDialog(null);
        }}
        onConfirmDelete={(task) => {
          deleteTask(task.id);
          setDialog(null);
        }}
      />
    </div>
  );
}

function KanbanColumn({
  status,
  compact,
  tasks,
  draggingTaskId,
  onDragStart,
  onDropTask,
  onEdit,
  onArchive,
  onDelete,
  pendingTaskIds,
}: {
  status: TaskStatus;
  compact: boolean;
  tasks: Task[];
  draggingTaskId: string | null;
  onDragStart: (taskId: string | null) => void;
  onDropTask: (targetStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onArchive: (task: Task) => void;
  onDelete: (task: Task) => void;
  pendingTaskIds: Set<string>;
}) {
  const columnTasks = tasks.filter((task) => task.status === status && !task.isArchived && !task.deletedAt);

  return (
    <section
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDropTask(status)}
      className={cn(
        "flex min-w-[320px] max-w-[360px] flex-1 flex-col rounded-xl border p-4 transition",
        draggingTaskId && "ring-1 ring-primary/20",
        (OPTIONAL_STATUSES as readonly TaskStatus[]).includes(status) ? "border-dashed border-outline-variant bg-surface-container-low/50" : "border-outline-variant/60 bg-surface-container-lowest",
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", status === "in_progress" ? "bg-primary" : status === "done" ? "bg-secondary" : "bg-outline")} />
          <h2 className="font-semibold">{STATUS_LABELS[status]}</h2>
          <Badge>{columnTasks.length}</Badge>
        </div>
        <MoreHorizontal className="h-5 w-5 text-on-surface-variant" />
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {columnTasks.length === 0 ? (
          <EmptyState title="Sin tareas" description="No hay cards en esta columna." className="min-h-36" />
        ) : (
          columnTasks.map((task) => <KanbanCard key={task.id} task={task} compact={compact} isPending={pendingTaskIds.has(task.id)} onEdit={onEdit} onDragStart={onDragStart} onArchive={onArchive} onDelete={onDelete} />)
        )}
      </div>
    </section>
  );
}

function KanbanCard({
  task,
  compact,
  onEdit,
  onDragStart,
  onArchive,
  onDelete,
  isPending,
}: {
  task: Task;
  compact: boolean;
  onEdit: (task: Task) => void;
  onDragStart: (taskId: string | null) => void;
  onArchive: (task: Task) => void;
  onDelete: (task: Task) => void;
  isPending: boolean;
}) {
  const organizations = useZenflowStore((state) => state.organizations);
  const projects = useZenflowStore((state) => state.projects);
  const subtasks = useZenflowStore((state) => state.subtasks);
  const taskLinks = useZenflowStore((state) => state.taskLinks);
  const organization = organizations.find((item) => item.id === task.organizationId);
  const project = projects.find((item) => item.id === task.projectId);
  const taskSubtasks = subtasks.filter((subtask) => subtask.taskId === task.id);
  const linksCount = taskLinks.filter((link) => link.taskId === task.id).length;

  return (
    <Card
      draggable={task.status !== "done" && !task.isArchived}
      onDragStart={() => onDragStart(task.id)}
      onDragEnd={() => onDragStart(null)}
      className={cn("cursor-grab p-4 active:cursor-grabbing", task.status === "done" && "cursor-not-allowed opacity-75", priorityBorder(task.priority))}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={priorityTone[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>
          <Badge>{task.type === "complex" ? "Compleja" : "Simple"}</Badge>
          {isPending ? <Badge tone="primary">Pendiente</Badge> : null}
        </div>
        <MoreHorizontal className="h-4 w-4 text-on-surface-variant" />
      </div>
      <h3 className={cn("font-semibold leading-tight", task.status === "done" && "line-through text-on-surface-variant")}>{task.title}</h3>
      {!compact ? (
        <>
          <p className="mt-2 text-xs text-on-surface-variant">
            {organization?.name} / {project?.name}
          </p>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-on-surface-variant">
              <span>{task.type === "complex" ? `Subtareas ${taskSubtasks.filter((subtask) => subtask.status === "done").length}/${taskSubtasks.length}` : "Progreso por estado"}</span>
              <span>{task.progress}%</span>
            </div>
            <ProgressBar value={task.progress} />
          </div>
        </>
      ) : null}
      <div className="mt-4 flex items-center justify-between border-t border-outline-variant/40 pt-3 text-xs text-on-surface-variant">
        <span className="flex items-center gap-1">
          <Timer className="h-3.5 w-3.5" />
          {task.realHours}/{task.estimatedHours}h
        </span>
        <span className="flex items-center gap-1">
          <LinkIcon className="h-3.5 w-3.5" />
          {linksCount}
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <Link className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-3 text-xs font-semibold text-on-surface transition-all hover:bg-surface-container-low" to={`/tasks/${task.id}`}>
          <Eye className="h-4 w-4" />
          Vista
        </Link>
        <Button size="sm" variant="ghost" icon={<Pencil className="h-4 w-4" />} onClick={() => onEdit(task)}>
          Editar
        </Button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-on-surface-variant">{task.status === "done" ? "Solo lectura" : "Arrastra para mover"}</span>
        {task.status === "done" && !task.isArchived ? (
          <Button size="sm" variant="outline" onClick={() => onArchive(task)}>Archivar</Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => onDelete(task)}>Papelera</Button>
        )}
      </div>
    </Card>
  );
}

function handleMoveTask(
  task: Task,
  targetStatus: TaskStatus,
  subtasks: Subtask[],
  setDialog: (dialog: BacklogDialog) => void,
  setPendingMoves: Dispatch<SetStateAction<PendingMove[]>>,
) {
  if (task.status === targetStatus) return;
  if (task.type === "complex" && task.status === "not_started" && targetStatus === "in_progress") {
    const taskSubtasks = subtasks.filter((subtask) => subtask.taskId === task.id && subtask.status !== "done");
    const firstSubtask = taskSubtasks[0];
    if (firstSubtask) {
      setDialog({ type: "progress", task, targetStatus, subtaskId: firstSubtask.id, realHours: 1 });
      return;
    }
  }
  if (targetStatus === "done" && task.type === "complex") {
    const pendingSubtasks = subtasks.filter((subtask) => subtask.taskId === task.id && subtask.status !== "done");
    if (pendingSubtasks.length) {
      setDialog({ type: "complete", task, targetStatus });
      return;
    }
  }
  stagePendingMove(setPendingMoves, { taskId: task.id, targetStatus });
}

function stagePendingMove(setPendingMoves: Dispatch<SetStateAction<PendingMove[]>>, move: PendingMove) {
  setPendingMoves((current) => [...current.filter((item) => item.taskId !== move.taskId), move]);
}

async function savePendingMoves(
  pendingMoves: PendingMove[],
  sourceTasks: Task[],
  completeSubtask: ReturnType<typeof useZenflowStore.getState>["completeSubtask"],
  moveTask: ReturnType<typeof useZenflowStore.getState>["moveTask"],
  syncWorkspace: ReturnType<typeof useZenflowStore.getState>["syncWorkspace"],
  setPendingMoves: Dispatch<SetStateAction<PendingMove[]>>,
  setDialog: Dispatch<SetStateAction<BacklogDialog | null>>,
  setIsSavingMoves: Dispatch<SetStateAction<boolean>>,
) {
  setIsSavingMoves(true);
  try {
    for (const pending of pendingMoves) {
      const task = sourceTasks.find((item) => item.id === pending.taskId);
      if (!task) continue;
      if (pending.subtaskId && pending.realHours && pending.realHours > 0) {
        completeSubtask(pending.subtaskId, pending.realHours);
      }
      const result = moveTask(pending.taskId, pending.targetStatus, { forceCompleteSubtasks: pending.forceCompleteSubtasks });
      if (!result.ok) {
        setDialog({ type: "message", title: "No se pudo guardar", message: result.message ?? `No se pudo guardar el estado de ${task.title}.` });
        return;
      }
    }
    await syncWorkspace();
    setPendingMoves([]);
    setDialog({ type: "message", title: "Cambios guardados", message: "Los estados del backlog se sincronizaron con Supabase." });
  } finally {
    setIsSavingMoves(false);
  }
}

function getPreviewProgress(task: Task, targetStatus: TaskStatus) {
  if (task.type !== "simple") return targetStatus === "done" ? 100 : task.progress;
  if (targetStatus === "done") return 100;
  if (targetStatus === "in_progress") return Math.max(task.progress, 50);
  if (targetStatus === "not_started") return 0;
  return task.progress;
}

function BacklogDialogModal({
  dialog,
  subtasks,
  onClose,
  onConfirmProgress,
  onConfirmComplete,
  onConfirmDelete,
}: {
  dialog: BacklogDialog | null;
  subtasks: Subtask[];
  onClose: () => void;
  onConfirmProgress: (payload: Extract<BacklogDialog, { type: "progress" }>) => void;
  onConfirmComplete: (task: Task, targetStatus: TaskStatus) => void;
  onConfirmDelete: (task: Task) => void;
}) {
  const [subtaskId, setSubtaskId] = useState("");
  const [realHours, setRealHours] = useState(1);

  const taskSubtasks = dialog?.type === "progress" ? subtasks.filter((subtask) => subtask.taskId === dialog.task.id && subtask.status !== "done") : [];

  if (!dialog) return null;

  return (
    <Modal
      isOpen={Boolean(dialog)}
      title={dialog.type === "message" ? dialog.title : dialog.type === "delete" ? "Enviar a papelera" : dialog.type === "progress" ? "Registrar avance" : "Completar tarea compleja"}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          {dialog.type === "message" ? <Button onClick={onClose}>Entendido</Button> : null}
          {dialog.type === "delete" ? <Button variant="danger" onClick={() => onConfirmDelete(dialog.task)}>Enviar a papelera</Button> : null}
          {dialog.type === "progress" ? (
            <Button onClick={() => onConfirmProgress({ ...dialog, subtaskId: subtaskId || dialog.subtaskId, realHours })}>Mover a proceso</Button>
          ) : null}
          {dialog.type === "complete" ? <Button onClick={() => onConfirmComplete(dialog.task, dialog.targetStatus)}>Confirmar y terminar</Button> : null}
        </div>
      }
    >
      {dialog.type === "message" ? <p className="text-sm text-on-surface-variant">{dialog.message}</p> : null}
      {dialog.type === "delete" ? <p className="text-sm text-on-surface-variant">La tarea "{dialog.task.title}" se movera a Papelera por 3 dias.</p> : null}
      {dialog.type === "progress" ? (
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">Antes de mover una tarea compleja a proceso, registra la subtarea trabajada y horas reales.</p>
          <Select value={subtaskId || dialog.subtaskId} onChange={(event) => setSubtaskId(event.target.value)}>
            {taskSubtasks.map((subtask) => <option key={subtask.id} value={subtask.id}>{subtask.title}</option>)}
          </Select>
          <Input type="number" min={0.25} step={0.25} value={realHours} onChange={(event) => setRealHours(Number(event.target.value))} />
        </div>
      ) : null}
      {dialog.type === "complete" ? (
        <p className="text-sm text-on-surface-variant">Esta tarea compleja tiene subtareas pendientes. Si confirmas, las subtareas pendientes se cerraran con sus horas estimadas y la card quedara en solo lectura.</p>
      ) : null}
    </Modal>
  );
}

function priorityBorder(priority: Priority): string {
  if (priority === "urgent") return "border-l-4 border-l-error";
  if (priority === "medium") return "border-l-4 border-l-tertiary-container";
  return "border-l-4 border-l-secondary";
}
