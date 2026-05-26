import { Eye, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { TASK_STATUSES } from "../../lib/constants";
import { formatShortDate } from "../../lib/dates";
import { useZenflowStore } from "../../state/zenflow-store";

export function ArchivePage() {
  const tasks = useZenflowStore((state) => state.tasks);
  const organizations = useZenflowStore((state) => state.organizations);
  const projects = useZenflowStore((state) => state.projects);
  const filters = useZenflowStore((state) => state.filters);
  const deleteTask = useZenflowStore((state) => state.deleteTask);
  const searchQuery = filters.searchQuery.trim().toLowerCase();
  const archived = tasks.filter((task) => {
    if (!task.isArchived || task.deletedAt) return false;
    if (filters.organizationId !== "all" && task.organizationId !== filters.organizationId) return false;
    if (filters.projectId !== "all" && task.projectId !== filters.projectId) return false;
    if (filters.status !== "all" && (TASK_STATUSES as readonly string[]).includes(filters.status) && task.status !== filters.status) return false;
    if (searchQuery && !`${task.title} ${task.description}`.toLowerCase().includes(searchQuery)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-bold">Archivo</h1>
        <p className="mt-1 text-on-surface-variant">Cards archivadas son historicas, de solo lectura y no se reabren.</p>
      </header>
      <Card className="overflow-x-auto">
        <div className="grid min-w-[820px] grid-cols-[1.5fr_1fr_1fr_0.8fr_0.8fr_auto] border-b border-outline-variant bg-surface-container-low px-4 py-3 text-xs font-semibold uppercase text-on-surface-variant">
          <span>Titulo</span><span>Organizacion</span><span>Proyecto</span><span>Horas</span><span>Diferencia</span><span>Accion</span>
        </div>
        {archived.map((task) => {
          const organization = organizations.find((item) => item.id === task.organizationId);
          const project = projects.find((item) => item.id === task.projectId);
          return (
            <div key={task.id} className="grid min-w-[820px] grid-cols-[1.5fr_1fr_1fr_0.8fr_0.8fr_auto] items-center border-b border-outline-variant px-4 py-3 text-sm last:border-b-0">
              <span className="font-semibold">{task.title}</span>
              <span>{organization?.name}</span>
              <span>{project?.name}</span>
              <span>{task.realHours}/{task.estimatedHours}h</span>
              <Badge tone={task.estimatedHours >= task.realHours ? "secondary" : "error"}>{Math.abs(task.estimatedHours - task.realHours)}h</Badge>
              <div className="flex gap-2">
                <Link className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-3 text-xs font-semibold text-on-surface transition-all hover:bg-surface-container-low" to={`/tasks/${task.id}`}>
                  <Eye className="h-4 w-4" />
                  Ver
                </Link>
                <Button variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => {
                  if (window.confirm(`Enviar "${task.title}" a papelera?`)) deleteTask(task.id);
                }}>
                  Borrar
                </Button>
              </div>
            </div>
          );
        })}
      </Card>
      <p className="text-sm text-on-surface-variant">Ultimo archivado: {archived[0]?.archivedAt ? formatShortDate(archived[0].archivedAt) : "Sin registros"}</p>
    </div>
  );
}
