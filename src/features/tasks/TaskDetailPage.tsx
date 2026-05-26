import { Archive, Calendar, CheckSquare, ExternalLink, Flag, History, Lock, Timer } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { PRIORITY_LABELS, STATUS_LABELS } from "../../lib/constants";
import { calculateHourDifference } from "../../lib/calculations";
import { canEditTask } from "../../lib/business-rules";
import { useZenflowStore } from "../../state/zenflow-store";
import { EmptyState } from "../../components/ui/EmptyState";

export function TaskDetailPage() {
  const { taskId } = useParams();
  const tasks = useZenflowStore((state) => state.tasks);
  const organizations = useZenflowStore((state) => state.organizations);
  const projects = useZenflowStore((state) => state.projects);
  const subtasks = useZenflowStore((state) => state.subtasks);
  const taskLinks = useZenflowStore((state) => state.taskLinks);
  const activityLogs = useZenflowStore((state) => state.activityLogs);
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return <EmptyState title="Tarea no encontrada" description="Esta tarea no existe en tu workspace actual." />;
  }

  const organization = organizations.find((item) => item.id === task.organizationId);
  const project = projects.find((item) => item.id === task.projectId);
  const taskSubtasks = subtasks.filter((subtask) => subtask.taskId === task.id);
  const links = taskLinks.filter((link) => link.taskId === task.id);
  const logs = activityLogs.filter((log) => log.taskId === task.id);
  const difference = calculateHourDifference(task.estimatedHours, task.realHours);
  const readOnly = !canEditTask(task);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex items-center justify-between border-b border-outline-variant pb-4">
        <div className="text-sm text-on-surface-variant">
          <Link className="hover:text-primary" to="/backlog">Backlog</Link> / {project?.name ?? "Sin proyecto"} / <span className="text-on-surface">{task.id}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">Share</Button>
          <Button variant="ghost" size="sm">More</Button>
        </div>
      </header>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Badge tone={task.type === "complex" ? "primary" : "neutral"}>{task.type === "complex" ? "Feature compleja" : "Card sencilla"}</Badge>
          {readOnly ? <Badge tone="neutral"><Lock className="mr-1 h-3 w-3" /> Solo lectura</Badge> : null}
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-on-background">{task.title}</h1>
        <p className="mt-3 max-w-3xl text-lg text-on-surface-variant">{task.description}</p>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <MetaCard icon={<CheckSquare className="h-5 w-5" />} label="Status" value={STATUS_LABELS[task.status]} />
        <MetaCard icon={<Flag className="h-5 w-5" />} label="Prioridad" value={PRIORITY_LABELS[task.priority]} />
        <MetaCard icon={<Calendar className="h-5 w-5" />} label="Fecha limite" value={task.dueDate ?? "Sin fecha"} />
        <MetaCard icon={<Archive className="h-5 w-5" />} label="Proyecto" value={`${organization?.name ?? "-"} / ${project?.name ?? "-"}`} />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <main className="space-y-8">
          <section>
            <h2 className="mb-3 flex items-center gap-2 border-b border-outline-variant pb-2 text-xl font-semibold">Notas</h2>
            <Card className="p-5">
              <p className="leading-relaxed text-on-surface-variant">{task.notes ?? "Sin notas aun. Este espacio se comportara como workspace tipo Notion en la siguiente etapa."}</p>
            </Card>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between border-b border-outline-variant pb-2">
              <h2 className="flex items-center gap-2 text-xl font-semibold"><CheckSquare className="h-5 w-5" /> Subtareas</h2>
              <Button variant="ghost" size="sm" disabled={readOnly}>Agregar subtarea</Button>
            </div>
            <div className="space-y-2">
              {taskSubtasks.length ? taskSubtasks.map((subtask) => (
                <div key={subtask.id} className={`flex items-center justify-between rounded-lg p-3 transition hover:bg-surface-container-low ${subtask.status === "done" ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-3">
                    <CheckSquare className={`h-5 w-5 ${subtask.status === "done" ? "text-primary" : "text-outline"}`} />
                    <div>
                      <p className={subtask.status === "done" ? "line-through" : "font-medium"}>{subtask.title}</p>
                      <p className="text-xs text-on-surface-variant">{subtask.estimatedHours}h estimadas / {subtask.realHours}h reales</p>
                    </div>
                  </div>
                  <Badge>{subtask.status}</Badge>
                </div>
              )) : <Card className="p-5 text-sm text-on-surface-variant">Las cards sencillas no calculan progreso desde subtareas.</Card>}
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 text-xl font-semibold">Tracking</h2>
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">Avance</span>
              <span className="font-bold text-primary">{task.progress}%</span>
            </div>
            <ProgressBar value={task.progress} />
            <div className="mt-5 space-y-3 text-sm">
              <InfoRow icon={<Timer className="h-4 w-4" />} label="Estimadas" value={`${task.estimatedHours}h`} />
              <InfoRow icon={<Timer className="h-4 w-4" />} label="Reales" value={`${task.realHours}h`} />
              <InfoRow icon={<Timer className="h-4 w-4" />} label={difference >= 0 ? "Ahorro" : "Sobreconsumo"} value={`${Math.abs(difference)}h`} />
            </div>
          </Card>

          <section>
            <h2 className="mb-3 border-b border-outline-variant pb-2 text-xl font-semibold">Links</h2>
            <div className="space-y-1">
              {links.length ? links.map((link) => (
                <a key={link.id} href={link.url} className="flex items-center gap-3 rounded-lg p-3 text-sm text-on-surface-variant transition hover:bg-surface-container-low hover:text-on-surface">
                  <ExternalLink className="h-4 w-4 text-outline" />
                  <span className="flex-1">{link.title}</span>
                </a>
              )) : <p className="text-sm text-on-surface-variant">Sin links registrados.</p>}
            </div>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 border-b border-outline-variant pb-2 text-xl font-semibold"><History className="h-5 w-5" /> Actividad</h2>
            <div className="space-y-4 border-l-2 border-surface-container-highest pl-4">
              {logs.map((log) => (
                <div key={log.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-outline-variant" />
                  <p className="text-sm font-medium">{log.message}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">{log.createdAt.slice(0, 10)}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function MetaCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="text-outline">{icon}</span>
      <div>
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </Card>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-on-surface-variant">{icon}{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
