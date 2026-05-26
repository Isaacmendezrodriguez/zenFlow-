import { CalendarPlus, X } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import type { CalendarBlockType, Task } from "../../types/domain";

export interface CalendarSlot {
  day: Date;
  hour: number;
  endHour: number;
}

export interface CreateCalendarBlockPayload {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  blockType: CalendarBlockType;
}

interface CreateCalendarBlockPanelProps {
  isOpen: boolean;
  slot: CalendarSlot | null;
  selectedTask: Task | null;
  onClose: () => void;
  onSelectTask: () => void;
  onCreate: (payload: CreateCalendarBlockPayload) => void;
}

export function CreateCalendarBlockPanel({ isOpen, slot, selectedTask, onClose, onSelectTask, onCreate }: CreateCalendarBlockPanelProps) {
  const [title, setTitle] = useState("Bloque de foco");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [blockType, setBlockType] = useState<CalendarBlockType>("complex_task");

  useEffect(() => {
    if (!isOpen) return;
    const hour = slot?.hour ?? 9;
    const nextStart = `${String(hour).padStart(2, "0")}:00`;
    const nextEnd = `${String(slot?.endHour ?? Math.min(hour + 1, 24)).padStart(2, "0")}:00`;

    setStartTime(nextStart);
    setEndTime(nextEnd);
    setTitle(selectedTask?.title ?? "Bloque de foco");
    setBlockType(selectedTask?.type === "simple" ? "simple_task" : "complex_task");
  }, [isOpen, selectedTask, slot]);

  if (!isOpen) return null;

  const canCreate = title.trim().length > 0 && Boolean(slot);

  return (
    <div className="absolute inset-y-0 right-0 z-40 flex w-full max-w-md animate-modal-in flex-col border-l border-outline-variant bg-surface-container-lowest shadow-lift">
      <div className="flex items-start justify-between border-b border-outline-variant p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Nuevo bloque</p>
          <h2 className="mt-1 text-xl font-semibold text-on-surface">Planificar horario</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar panel">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Horario seleccionado</p>
          <p className="mt-1 text-sm font-medium text-on-surface">
            {slot ? `${format(slot.day, "EEE d MMM")} · ${startTime} - ${endTime}` : "Selecciona un recuadro de hora en el calendario"}
          </p>
          {slot ? <p className="mt-1 text-xs text-on-surface-variant">Duracion: {Math.max(slot.endHour - slot.hour, 1)}h</p> : null}
        </div>

        {selectedTask ? (
          <div className="rounded-lg border border-primary/30 bg-primary-container p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-on-primary-container">{selectedTask.title}</p>
              <Badge tone={selectedTask.priority === "urgent" ? "error" : "neutral"}>{selectedTask.priority}</Badge>
            </div>
            <p className="line-clamp-2 text-xs text-on-primary-container/80">{selectedTask.description}</p>
          </div>
        ) : null}

        <label className="block text-sm font-medium text-on-surface">
          Titulo
          <Input className="mt-2" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-on-surface">
            Inicio
            <Input className="mt-2" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
          </label>
          <label className="block text-sm font-medium text-on-surface">
            Fin
            <Input className="mt-2" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
          </label>
        </div>
        <label className="block text-sm font-medium text-on-surface">
          Tipo
          <Select className="mt-2" value={blockType} onChange={(event) => setBlockType(event.target.value as CalendarBlockType)}>
            <option value="complex_task">Tarea compleja</option>
            <option value="simple_task">Tarea simple</option>
            <option value="meeting">Reunion</option>
            <option value="personal">Personal</option>
            <option value="free">Libre</option>
          </Select>
        </label>
        <label className="block text-sm font-medium text-on-surface">
          Notas
          <Textarea className="mt-2" value={description} placeholder="Contexto rapido para este bloque..." onChange={(event) => setDescription(event.target.value)} />
        </label>
        <Button type="button" variant="outline" className="w-full" icon={<CalendarPlus className="h-4 w-4" />} onClick={onSelectTask}>
          {selectedTask ? "Cambiar tarea vinculada" : "Vincular con backlog"}
        </Button>
      </div>

      <div className="flex gap-2 border-t border-outline-variant p-5">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          className="flex-1"
          disabled={!canCreate}
          onClick={() => {
            onCreate({ title, description, startTime, endTime, blockType });
          }}
        >
          Crear bloque
        </Button>
      </div>
    </div>
  );
}
