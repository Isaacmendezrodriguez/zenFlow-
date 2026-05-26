import { addDays, addMonths, addWeeks, eachDayOfInterval, endOfMonth, format, isSameMonth, startOfMonth, startOfWeek, subMonths, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen, Plus, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Tabs } from "../../components/ui/Tabs";
import { cn } from "../../lib/utils";
import { useZenflowStore } from "../../state/zenflow-store";
import type { CalendarBlock, CalendarBlockStatus, Task } from "../../types/domain";
import { CalendarBlockDetailPanel } from "./CalendarBlockDetailPanel";
import { ConfirmHoursModal } from "./ConfirmHoursModal";
import { CreateCalendarBlockPanel, type CalendarSlot, type CreateCalendarBlockPayload } from "./CreateCalendarBlockPanel";
import { DaySummaryPanel } from "./DaySummaryPanel";
import { SelectBacklogTaskModal } from "./SelectBacklogTaskModal";

const hours = Array.from({ length: 24 }, (_, index) => index);

export function TodoWeeklyPage() {
  const [selectedBlock, setSelectedBlock] = useState<CalendarBlock | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isConfirmHoursOpen, setIsConfirmHoursOpen] = useState(false);
  const [isSelectTaskOpen, setIsSelectTaskOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week");
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [showFilters, setShowFilters] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const calendarBlocks = useZenflowStore((state) => state.calendarBlocks);
  const organizations = useZenflowStore((state) => state.organizations);
  const projects = useZenflowStore((state) => state.projects);
  const filters = useZenflowStore((state) => state.filters);
  const updateFilters = useZenflowStore((state) => state.updateFilters);
  const createCalendarBlock = useZenflowStore((state) => state.createCalendarBlock);
  const completeCalendarBlock = useZenflowStore((state) => state.completeCalendarBlock);
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const days = viewMode === "day" ? [selectedDay] : weekDays;
  const calendarStatusFilter = filters.status === "all" || ["scheduled", "in_progress", "completed", "cancelled"].includes(filters.status) ? filters.status : "all";
  const searchQuery = filters.searchQuery.trim().toLowerCase();
  const visibleBlocks = calendarBlocks.filter((block) => {
    if (filters.organizationId !== "all" && block.organizationId !== filters.organizationId) return false;
    if (filters.projectId !== "all" && block.projectId !== filters.projectId) return false;
    if (calendarStatusFilter !== "all" && block.status !== calendarStatusFilter) return false;
    if (searchQuery && !`${block.title} ${block.description ?? ""}`.toLowerCase().includes(searchQuery)) return false;
    return true;
  });
  const scopedProjects = projects.filter((project) => filters.organizationId === "all" || project.organizationId === filters.organizationId);
  const now = new Date();

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || viewMode === "month") return;
    const top = Math.max(now.getHours() * 64 - 180, 0);
    container.scrollTo({ top, behavior: "smooth" });
  }, [anchorDate, selectedDay, viewMode]);

  function openCreatePanel(slot: CalendarSlot) {
    setSelectedBlock(null);
    if (!isCreateOpen) setSelectedTask(null);
    setSelectedSlot(slot);
    setIsCreateOpen(true);
  }

  function selectCalendarSlot(day: Date, hour: number) {
    if (isCreateOpen && selectedSlot && isSameCalendarDay(day.toISOString(), selectedSlot.day)) {
      const start = Math.min(selectedSlot.hour, hour);
      let end = Math.max(selectedSlot.hour, hour);
      if (end === start) end = start + 1;
      const duration = end - start;
      if (duration > 4) {
        setMessage("El bloque no puede durar mas de 4 horas.");
        return;
      }
      setSelectedSlot({ day, hour: start, endHour: end });
      return;
    }
    openCreatePanel({ day, hour, endHour: hour + 1 });
  }

  function createBlock(payload: CreateCalendarBlockPayload) {
    if (!selectedSlot) return;

    const startAt = createDateFromSlot(selectedSlot.day, payload.startTime);
    const endAt = createEndDateFromSlot(selectedSlot.day, payload.startTime, payload.endTime);
    const result = createCalendarBlock({
      organizationId: selectedTask?.organizationId,
      projectId: selectedTask?.projectId,
      taskId: selectedTask?.id,
      title: payload.title.trim(),
      description: payload.description,
      blockType: selectedTask ? (selectedTask.type === "simple" ? "simple_task" : "complex_task") : payload.blockType,
      startAt,
      endAt,
      color: selectedTask?.priority === "urgent" ? "#fee2e2" : selectedTask?.priority === "medium" ? "#dbeafe" : "#d1fae5",
    });

    if (!result.ok) {
      setMessage(result.message ?? "No se pudo crear el bloque.");
      return;
    }
    if (result.warning) setMessage(result.warning);
    setSelectedBlock(result.block ?? null);
    setIsCreateOpen(false);
  }

  function goToToday() {
    const today = new Date();
    setAnchorDate(today);
    setSelectedDay(today);
  }

  function moveCalendar(direction: "previous" | "next") {
    const isNext = direction === "next";

    if (viewMode === "day") {
      const nextDay = addDays(selectedDay, isNext ? 1 : -1);
      setSelectedDay(nextDay);
      setAnchorDate(nextDay);
      return;
    }

    if (viewMode === "month") {
      const nextMonth = isNext ? addMonths(anchorDate, 1) : subMonths(anchorDate, 1);
      setAnchorDate(nextMonth);
      setSelectedDay(nextMonth);
      return;
    }

    const nextWeek = isNext ? addWeeks(anchorDate, 1) : subWeeks(anchorDate, 1);
    setAnchorDate(nextWeek);
    setSelectedDay(nextWeek);
  }

  const calendarTitle = viewMode === "day"
    ? format(selectedDay, "dd MMM yyyy")
    : viewMode === "month"
      ? format(anchorDate, "MMMM yyyy")
      : `${format(weekDays[0], "dd MMM")} - ${format(weekDays[6], "dd MMM")}`;

  function completeBlock(realHours?: number) {
    if (!selectedBlock) return;
    const result = completeCalendarBlock(selectedBlock.id, realHours);
    if (!result.ok) {
      setMessage(result.message ?? "No se pudo completar el bloque.");
      return;
    }
    setIsConfirmHoursOpen(false);
    setSelectedBlock(null);
  }

  return (
    <div className={cn("relative grid h-[calc(100vh-7rem)] grid-cols-1 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest", showRightPanel ? "lg:grid-cols-[1fr_21rem]" : "lg:grid-cols-1")}>
      <section className="flex min-h-0 min-w-0 flex-col">
        <div className="flex min-h-16 flex-col gap-3 border-b border-outline-variant bg-surface-container-lowest px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
            <Button variant="ghost" size="icon" onClick={() => moveCalendar("previous")}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => moveCalendar("next")}><ChevronRight className="h-4 w-4" /></Button>
            <h1 className="min-w-0 text-lg font-semibold sm:text-xl">
              {calendarTitle}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowFilters((value) => !value)} aria-label="Mostrar filtros">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowRightPanel((value) => !value)} aria-label="Compactar panel">
              {showRightPanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
            <Tabs value={viewMode} onChange={setViewMode} items={[{ label: "Day", value: "day" }, { label: "Week", value: "week" }, { label: "Month", value: "month" }]} />
          </div>
        </div>
        <div className={cn("grid gap-2 border-b border-outline-variant bg-surface-container-lowest px-4 transition-all sm:grid-cols-3", showFilters ? "max-h-40 py-3 opacity-100" : "max-h-0 overflow-hidden py-0 opacity-0")}>
          <select className="h-12 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm font-medium text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={filters.organizationId} onChange={(event) => updateFilters({ organizationId: event.target.value })}>
            <option value="all">Todas las organizaciones</option>
            {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
          </select>
          <select className="h-12 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm font-medium text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={filters.projectId} onChange={(event) => updateFilters({ projectId: event.target.value })}>
            <option value="all">Todos los proyectos</option>
            {scopedProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <select className="h-12 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm font-medium text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={calendarStatusFilter} onChange={(event) => updateFilters({ status: event.target.value as CalendarBlockStatus | "all" })}>
            <option value="all">Todos los estados</option>
            {(["scheduled", "in_progress", "completed", "cancelled"] as CalendarBlockStatus[]).map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
        {message ? (
          <button className="border-b border-outline-variant bg-error-container px-4 py-2 text-left text-sm font-medium text-on-error-container" onClick={() => setMessage(null)}>
            {message}
          </button>
        ) : null}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto pb-24">
          {viewMode === "month" ? (
            <MonthView anchorDate={anchorDate} blocks={visibleBlocks} onSelectDay={(day) => { setSelectedDay(day); setViewMode("day"); }} onSelectBlock={setSelectedBlock} />
          ) : (
          <div className={cn("grid min-w-[980px]", viewMode === "day" ? "grid-cols-[4rem_minmax(18rem,1fr)]" : "grid-cols-[4rem_repeat(7,minmax(8rem,1fr))]")}>
            <div className="sticky top-0 z-20 border-b border-r border-outline-variant bg-surface" />
            {days.map((day, index) => (
              <div key={day.toISOString()} className={cn("sticky top-0 z-20 border-b border-r border-outline-variant bg-surface-container-lowest/95 p-3 text-center backdrop-blur", index >= 5 && "bg-surface-container-low")}>
                <button className="text-xs font-semibold uppercase text-on-surface-variant hover:text-primary" onClick={() => { setSelectedDay(day); setViewMode("day"); }}>{format(day, "EEE")}</button>
                <p className={cn("mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold", index === 2 && "bg-primary text-on-primary")}>
                  {format(day, "d")}
                </p>
              </div>
            ))}
            {hours.map((hour) => (
              <HourRow key={hour} hour={hour} days={days} blocks={visibleBlocks} selectedSlot={selectedSlot} now={now} onSelectBlock={setSelectedBlock} onSelectSlot={selectCalendarSlot} />
            ))}
          </div>
          )}
        </div>
      </section>
      {showRightPanel ? <aside className="hidden min-h-0 overflow-y-auto border-l border-outline-variant bg-surface-container-low lg:flex lg:flex-col">
        <div className="space-y-5 p-5">
          <DaySummaryPanel />
          <Button className="w-full" icon={<Plus className="h-4 w-4" />} onClick={() => openCreatePanel({ day: days[0] ?? new Date(), hour: 9, endHour: 10 })}>
            Nuevo bloque
          </Button>
          {selectedBlock ? (
            <button
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-4 text-left transition hover:border-primary/40 hover:bg-surface"
              onClick={() => setSelectedBlock(selectedBlock)}
            >
              <p className="font-semibold text-on-surface">{selectedBlock.title}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{selectedBlock.blockType} / {selectedBlock.durationHours}h</p>
            </button>
          ) : null}
        </div>
      </aside> : null}
      <CalendarBlockDetailPanel block={selectedBlock} onClose={() => setSelectedBlock(null)} onConfirmHours={() => setIsConfirmHoursOpen(true)} />
      <CreateCalendarBlockPanel
        isOpen={isCreateOpen}
        slot={selectedSlot}
        selectedTask={selectedTask}
        onClose={() => setIsCreateOpen(false)}
        onSelectTask={() => {
          setIsSelectTaskOpen(true);
        }}
        onCreate={createBlock}
      />
      <ConfirmHoursModal block={selectedBlock} isOpen={isConfirmHoursOpen} onClose={() => setIsConfirmHoursOpen(false)} onConfirm={completeBlock} />
      <SelectBacklogTaskModal isOpen={isSelectTaskOpen} onClose={() => setIsSelectTaskOpen(false)} onSelectTask={setSelectedTask} />
    </div>
  );
}

function MonthView({ anchorDate, blocks, onSelectDay, onSelectBlock }: { anchorDate: Date; blocks: CalendarBlock[]; onSelectDay: (day: Date) => void; onSelectBlock: (block: CalendarBlock) => void }) {
  const monthStart = startOfMonth(anchorDate);
  const monthEnd = endOfMonth(anchorDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = addDays(startOfWeek(monthEnd, { weekStartsOn: 1 }), 6);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="grid min-w-[760px] grid-cols-7">
      {days.map((day) => {
        const dayBlocks = blocks.filter((block) => isSameCalendarDay(block.startAt, day));
        return (
          <div key={day.toISOString()} className={cn("min-h-32 border-b border-r border-outline-variant p-2", !isSameMonth(day, anchorDate) && "bg-surface-container-low text-on-surface-variant")}>
            <button className="mb-2 text-sm font-semibold hover:text-primary" onClick={() => onSelectDay(day)}>{format(day, "d")}</button>
            <div className="space-y-1">
              {dayBlocks.slice(0, 3).map((block) => (
                <button key={block.id} className="block w-full truncate rounded bg-primary-container px-2 py-1 text-left text-xs text-on-primary-container" onClick={() => onSelectBlock(block)}>
                  {format(new Date(block.startAt), "HH:mm")} {block.title}
                </button>
              ))}
              {dayBlocks.length > 3 ? <p className="text-xs text-on-surface-variant">+{dayBlocks.length - 3} mas</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HourRow({
  hour,
  days,
  blocks,
  selectedSlot,
  now,
  onSelectBlock,
  onSelectSlot,
}: {
  hour: number;
  days: Date[];
  blocks: CalendarBlock[];
  selectedSlot: CalendarSlot | null;
  now: Date;
  onSelectBlock: (block: CalendarBlock) => void;
  onSelectSlot: (day: Date, hour: number) => void;
}) {
  return (
    <>
      <div className="h-16 border-b border-r border-outline-variant/50 bg-background pr-2 pt-1 text-right text-xs text-on-surface-variant">{String(hour).padStart(2, "0")}:00</div>
      {days.map((day, dayIndex) => {
        const block = blocks.find((item) => new Date(item.startAt).getHours() === hour && isSameCalendarDay(item.startAt, day));
        const isSelected = Boolean(selectedSlot && isSameCalendarDay(day.toISOString(), selectedSlot.day) && hour >= selectedSlot.hour && hour < selectedSlot.endHour);
        const isCurrentHour = isSameCalendarDay(day.toISOString(), now) && hour === now.getHours();
        const currentMinuteOffset = (now.getMinutes() / 60) * 64;
        const blockStart = block ? new Date(block.startAt) : null;
        const blockOffset = blockStart ? (blockStart.getMinutes() / 60) * 64 + 4 : 4;
        const blockHeight = block ? Math.max(block.durationHours * 64 - 8, 40) : 56;
        return (
          <div key={dayIndex} className={cn("relative h-16 border-b border-r border-outline-variant/40", dayIndex === 2 && "bg-primary/5", dayIndex >= 5 && "bg-surface-container-low/40", isSelected && "bg-primary-container/70 ring-1 ring-inset ring-primary/30")}>
            {isCurrentHour ? (
              <div className="pointer-events-none absolute left-0 right-0 z-20 h-px bg-error" style={{ top: currentMinuteOffset }}>
                <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-error" />
                <span className="absolute left-2 -top-3 rounded-full bg-error px-1.5 py-0.5 text-[10px] font-semibold text-white">Ahora</span>
              </div>
            ) : null}
            {block ? (
              <button
                onClick={() => onSelectBlock(block)}
                className="calendar-block absolute inset-x-1 z-10 overflow-hidden rounded-md border border-outline-variant border-l-4 p-1.5 text-left text-xs text-[#111827] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft dark:border-white/20 dark:text-[#111827]"
                style={{ top: blockOffset, height: blockHeight, background: block.color, borderLeftColor: block.blockType === "meeting" ? "#544fc0" : block.blockType === "personal" ? "#fe9562" : "#006b5f" }}
              >
                <p className="truncate font-semibold">{block.title}</p>
                <p className="truncate opacity-75">
                  {format(new Date(block.startAt), "HH:mm")} - {format(new Date(block.endAt), "HH:mm")} / {block.durationHours}h
                </p>
                <p className="mt-1 truncate text-[10px] opacity-75">{block.taskId || block.subtaskId ? "Afecta backlog" : "No afecta backlog"}</p>
              </button>
            ) : (
              <button
                className="group flex h-full w-full items-center justify-center text-[11px] font-medium text-transparent transition hover:bg-primary-container/70 hover:text-on-primary-container"
                onClick={() => onSelectSlot(day, hour)}
                aria-label={`Asignar tarea ${format(day, "yyyy-MM-dd")} ${String(hour).padStart(2, "0")}:00`}
              >
                <span className="rounded-full border border-primary/20 bg-surface-container-lowest px-2 py-1 opacity-0 shadow-sm transition group-hover:opacity-100">
                  Asignar
                </span>
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}

function createDateFromSlot(day: Date, time: string): string {
  const [hoursValue = "0", minutesValue = "0"] = time.split(":");
  const nextDate = new Date(day);
  nextDate.setHours(Number(hoursValue), Number(minutesValue), 0, 0);
  return nextDate.toISOString();
}

function createEndDateFromSlot(day: Date, startTime: string, endTime: string): string {
  const start = new Date(createDateFromSlot(day, startTime));
  const end = new Date(createDateFromSlot(day, endTime));
  if (end <= start) end.setHours(start.getHours() + 1);
  return end.toISOString();
}

function isSameCalendarDay(dateInput: string, day: Date): boolean {
  const date = new Date(dateInput);
  return date.getFullYear() === day.getFullYear() && date.getMonth() === day.getMonth() && date.getDate() === day.getDate();
}
