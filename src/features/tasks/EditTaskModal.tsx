import { Lock } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { canEditTask } from "../../lib/business-rules";
import { getHourStatusLabel } from "../../lib/calculations";
import { useZenflowStore } from "../../state/zenflow-store";
import type { Subtask, Task } from "../../types/domain";
import { useEffect, useState } from "react";

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditTaskModal({ task, isOpen, onClose }: EditTaskModalProps) {
  const readOnly = task ? !canEditTask(task) : true;
  const updateTask = useZenflowStore((state) => state.updateTask);
  const subtasks = useZenflowStore((state) => state.subtasks);
  const updateTaskHours = useZenflowStore((state) => state.updateTaskHours);
  const updateSubtaskHours = useZenflowStore((state) => state.updateSubtaskHours);
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [realHours, setRealHours] = useState(task?.realHours ?? 0);
  const [subtaskHours, setSubtaskHours] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string | null>(null);
  const taskSubtasks = task ? subtasks.filter((subtask) => subtask.taskId === task.id) : [];

  useEffect(() => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setPriority(task?.priority ?? "medium");
    setDueDate(task?.dueDate ?? "");
    setRealHours(task?.realHours ?? 0);
    setSubtaskHours(Object.fromEntries(subtasks.filter((subtask) => subtask.taskId === task?.id).map((subtask) => [subtask.id, subtask.realHours])));
    setMessage(null);
  }, [task, subtasks]);

  function save() {
    if (!task) return;
    const result = updateTask(task.id, { title, description, priority, dueDate: dueDate || undefined });
    if (!result.ok) {
      setMessage(result.message ?? "No se pudo actualizar la tarea.");
      return;
    }
    if (task.type === "simple") {
      const shouldComplete = task.estimatedHours > 0 && realHours >= task.estimatedHours
        ? window.confirm("Las horas reales alcanzan o superan las estimadas. ¿La tarea quedo terminada?")
        : false;
      updateTaskHours(task.id, realHours, shouldComplete);
    } else {
      taskSubtasks.forEach((subtask) => {
        const nextHours = subtaskHours[subtask.id] ?? subtask.realHours;
        const shouldComplete = subtask.estimatedHours > 0 && nextHours >= subtask.estimatedHours
          ? window.confirm(`"${subtask.title}" alcanzo sus horas estimadas. ¿Marcar subtarea como terminada?`)
          : false;
        updateSubtaskHours(subtask.id, nextHours, shouldComplete);
      });
    }
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar tarea"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={readOnly} onClick={save}>Guardar cambios</Button>
        </div>
      }
    >
      {task ? (
        <div className="space-y-4">
          {readOnly ? (
            <div className="flex items-center gap-2 rounded-lg bg-surface-container p-3 text-sm text-on-surface-variant">
              <Lock className="h-4 w-4" />
              Las tareas completadas, archivadas o eliminadas son de solo lectura.
            </div>
          ) : null}
          {message ? <div className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">{message}</div> : null}
          <Input value={title} onChange={(event) => setTitle(event.target.value)} disabled={readOnly} />
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} disabled={readOnly} />
          <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={readOnly} />
          <Select value={priority} onChange={(event) => setPriority(event.target.value as Task["priority"])} disabled={readOnly}>
            <option value="urgent">Urgente</option>
            <option value="medium">Intermedia</option>
            <option value="low">Baja</option>
          </Select>
          <div className="rounded-lg border border-outline-variant bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Horas y progreso</p>
              <Badge>{task.progress}%</Badge>
            </div>
            <ProgressBar value={task.progress} />
            {task.type === "simple" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="text-sm font-medium">
                  Estimadas
                  <Input className="mt-1" type="number" value={task.estimatedHours} disabled />
                </label>
                <label className="text-sm font-medium">
                  Reales
                  <Input className="mt-1" type="number" min={0} step={0.25} value={realHours} onChange={(event) => setRealHours(Number(event.target.value))} disabled={readOnly} />
                </label>
                <div className="rounded-lg bg-surface-container-low p-3 text-sm">
                  <p className="text-on-surface-variant">Estado</p>
                  <p className="font-semibold">{getHourStatusLabel(task.estimatedHours, realHours)}</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {taskSubtasks.map((subtask) => (
                  <SubtaskHourEditor
                    key={subtask.id}
                    subtask={subtask}
                    value={subtaskHours[subtask.id] ?? subtask.realHours}
                    disabled={readOnly}
                    onChange={(value) => setSubtaskHours((current) => ({ ...current, [subtask.id]: value }))}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function SubtaskHourEditor({ subtask, value, disabled, onChange }: { subtask: Subtask; value: number; disabled: boolean; onChange: (value: number) => void }) {
  const progress = subtask.estimatedHours > 0 ? Math.min(Math.round((value / subtask.estimatedHours) * 100), 100) : 0;
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{subtask.title}</p>
          <p className="text-xs text-on-surface-variant">{subtask.estimatedHours}h estimadas</p>
        </div>
        <Badge>{getHourStatusLabel(subtask.estimatedHours, value)}</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <ProgressBar value={progress} className="self-center" />
        <Input type="number" min={0} step={0.25} value={value} disabled={disabled} onChange={(event) => onChange(Number(event.target.value))} />
      </div>
    </div>
  );
}
