import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useZenflowStore } from "../../state/zenflow-store";
import type { Task } from "../../types/domain";

interface SelectBacklogTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTask: (task: Task) => void;
}

export function SelectBacklogTaskModal({ isOpen, onClose, onSelectTask }: SelectBacklogTaskModalProps) {
  const tasks = useZenflowStore((state) => state.tasks);
  const organizations = useZenflowStore((state) => state.organizations);
  const projects = useZenflowStore((state) => state.projects);
  const backlogTasks = tasks.filter((task) => !task.isArchived && !task.deletedAt && task.status !== "done");

  return (
    <Modal
      isOpen={isOpen}
      title="Seleccionar tarea del backlog"
      onClose={onClose}
      footer={
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {backlogTasks.map((task) => (
          <TaskOption key={task.id} task={task} organizationName={organizations.find((item) => item.id === task.organizationId)?.name} projectName={projects.find((item) => item.id === task.projectId)?.name} onSelect={() => {
            onSelectTask(task);
            onClose();
          }} />
        ))}
      </div>
    </Modal>
  );
}

function TaskOption({ task, organizationName, projectName, onSelect }: { task: Task; organizationName?: string; projectName?: string; onSelect: () => void }) {
  return (
    <button
      className="flex w-full items-start justify-between gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 text-left transition hover:border-primary/40 hover:bg-surface-container-low dark:bg-surface-container-low dark:hover:bg-surface-container"
      onClick={onSelect}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-on-surface">{task.title}</p>
        <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">{task.description}</p>
        <p className="mt-2 truncate text-[11px] font-medium text-on-surface-variant">{organizationName ?? "Sin organizacion"} / {projectName ?? "Sin proyecto"}</p>
      </div>
      <Badge tone={task.priority === "urgent" ? "error" : "neutral"}>{task.priority}</Badge>
    </button>
  );
}
