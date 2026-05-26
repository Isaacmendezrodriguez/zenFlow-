import { ChevronLeft, Coffee, Maximize2, MoreHorizontal, Pause, Play, Square, Timer, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useZenflowStore } from "../../state/zenflow-store";
import { cn } from "../../lib/utils";

function formatTimer(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function TimerWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [timerMinutes, setTimerMinutes] = useState(50);
  const calendarBlocks = useZenflowStore((state) => state.calendarBlocks);
  const userSettings = useZenflowStore((state) => state.userSettings);
  const activeTimer = useZenflowStore((state) => state.activeTimer);
  const startTimer = useZenflowStore((state) => state.startTimer);
  const stopTimer = useZenflowStore((state) => state.stopTimer);
  const toggleTimer = useZenflowStore((state) => state.toggleTimer);
  const tickTimer = useZenflowStore((state) => state.tickTimer);

  useEffect(() => {
    if (!activeTimer?.isRunning) return undefined;
    const interval = window.setInterval(() => tickTimer(), 1000);
    return () => window.clearInterval(interval);
  }, [activeTimer?.isRunning, tickTimer]);

  const availableBlocks = useMemo(
    () => calendarBlocks.filter((block) => block.status !== "completed" && block.status !== "cancelled"),
    [calendarBlocks],
  );
  const activeBlock = calendarBlocks.find((block) => block.id === activeTimer?.blockId) ?? calendarBlocks.find((block) => block.status === "in_progress");
  const selectedBlock = calendarBlocks.find((block) => block.id === selectedBlockId);
  const timerTitle = activeBlock?.title ?? selectedBlock?.title ?? "Timer ZenFlow";
  const remainingSeconds = activeTimer ? Math.max(activeTimer.durationSeconds - activeTimer.elapsedSeconds, 0) : timerMinutes * 60;
  const progress = activeTimer ? Math.min((activeTimer.elapsedSeconds / activeTimer.durationSeconds) * 100, 100) : 0;
  const durationLabel = activeTimer ? `${Math.round(activeTimer.durationSeconds / 60)} min` : `${timerMinutes} min`;

  function beginTimer() {
    const blockId = selectedBlockId || activeBlock?.id || availableBlocks[0]?.id;
    startTimer(blockId, timerMinutes);
  }

  function handlePrimaryAction() {
    if (activeTimer) {
      if (remainingSeconds <= 0) {
        stopTimer();
        return;
      }
      toggleTimer();
      return;
    }
    beginTimer();
  }

  function updateTimerMinutes(value: string) {
    const nextValue = Number(value);
    if (Number.isFinite(nextValue)) {
      setTimerMinutes(Math.min(Math.max(nextValue, 5), 240));
    }
  }

  if (!isExpanded) {
    return (
      <button
        className="fixed bottom-5 right-0 z-40 flex h-11 max-w-[12.5rem] items-center gap-2 rounded-l-xl border border-r-0 border-outline-variant bg-surface-container-lowest px-3 text-on-surface shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition hover:-translate-x-1 dark:border-white/10 dark:bg-[#1f2229] dark:text-white"
        onClick={() => setIsExpanded(true)}
        aria-label="Expandir temporizador"
      >
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", activeTimer?.isRunning ? "bg-[#dff9ed] text-[#0d8a5f] dark:bg-[#123323] dark:text-[#54d990]" : "bg-primary-container text-primary")}>
          <Timer className="h-4 w-4" />
        </span>
        <span className="min-w-0 text-left leading-none">
          <span className="block max-w-24 truncate text-[10px] font-semibold text-primary dark:text-[#72c58a]">{timerTitle}</span>
          <span className="block font-mono text-xs font-semibold">{formatTimer(remainingSeconds)}</span>
        </span>
        <ChevronLeft className="h-4 w-4 shrink-0 text-on-surface-variant dark:text-white/70" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[calc(100vw-2.5rem)] max-w-[380px] rounded-xl border border-white/10 bg-[#1f2229] p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <div className="mb-3 flex items-center justify-between">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10"
          onClick={() => setIsExpanded(false)}
          aria-label="Guardar temporizador en pestaña"
        >
          <Maximize2 className="h-4 w-4 rotate-180" />
        </button>
        <div className="min-w-0 px-3 text-center">
          <p className="truncate text-sm font-semibold text-white">Periodo de concentracion</p>
          <p className="text-[11px] text-white/55">{durationLabel} · descanso de {userSettings.timerBreakMinutes} min</p>
        </div>
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10" onClick={() => setIsExpanded(false)} aria-label="Cerrar temporizador">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-[1fr_5.5rem] gap-2">
        <select
          value={selectedBlockId || activeTimer?.blockId || activeBlock?.id || availableBlocks[0]?.id || ""}
          onChange={(event) => setSelectedBlockId(event.target.value)}
          disabled={Boolean(activeTimer)}
          className="h-11 min-w-0 rounded-lg border border-white/10 bg-[#2a2d35] px-3 text-sm font-medium text-white outline-none transition focus:border-[#4cc9f0] focus:ring-2 focus:ring-[#4cc9f0]/20 disabled:cursor-not-allowed disabled:opacity-80"
        >
          <option value="" disabled>Selecciona bloque</option>
          {availableBlocks.map((block) => <option key={block.id} value={block.id}>{block.title}</option>)}
        </select>
        <input
          className="h-11 rounded-lg border border-white/10 bg-white px-3 text-center text-sm font-semibold text-[#101318] outline-none transition focus:border-[#4cc9f0] focus:ring-2 focus:ring-[#4cc9f0]/20 disabled:cursor-not-allowed disabled:opacity-80"
          type="number"
          min={5}
          max={240}
          step={5}
          value={timerMinutes}
          disabled={Boolean(activeTimer)}
          onChange={(event) => updateTimerMinutes(event.target.value)}
          aria-label="Duracion del temporizador en minutos"
        />
      </div>

      <div className="mx-auto mt-6 flex h-32 w-32 items-center justify-center rounded-full bg-[#2b2e36] shadow-inner">
        <div
          className="relative flex h-28 w-28 items-center justify-center rounded-full transition"
          style={{ background: `conic-gradient(#4cc9f0 ${progress * 3.6}deg, #373b44 0deg)` }}
        >
          <div className="absolute inset-[10px] rounded-full bg-[#242832]" />
          <div className="absolute inset-5 rounded-full border border-dashed border-white/10" />
          <Coffee className="relative h-8 w-8 text-[#4cc9f0]" />
        </div>
      </div>

      <div className="mt-4 text-center font-mono text-4xl font-semibold leading-none text-white">{formatTimer(remainingSeconds)}</div>
      <div className="mt-5 flex items-center justify-center gap-3">
        <button className="flex h-14 w-14 items-center justify-center rounded-full bg-[#4cc9f0] text-[#101318] shadow-lg transition hover:scale-105" aria-label={activeTimer?.isRunning ? "Pausar temporizador" : "Iniciar temporizador"} onClick={handlePrimaryAction}>
          {activeTimer?.isRunning ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
        </button>
        <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15" aria-label="Mas opciones" onClick={() => setShowOptions((value) => !value)}>
          <MoreHorizontal className="h-5 w-5" />
        </button>
        <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15" aria-label="Finalizar temporizador" onClick={stopTimer}>
          <Square className="h-4 w-4" />
        </button>
      </div>
      {showOptions ? (
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-white/5 p-2 text-xs font-semibold text-white/85">
          <button className="rounded-md px-2 py-2 transition hover:bg-white/10" onClick={() => setTimerMinutes((value) => Math.max(value - 5, 5))} disabled={Boolean(activeTimer)}>-5 min</button>
          <button className="rounded-md px-2 py-2 transition hover:bg-white/10" onClick={() => setTimerMinutes(50)} disabled={Boolean(activeTimer)}>50 min</button>
          <button className="rounded-md px-2 py-2 transition hover:bg-white/10" onClick={() => setTimerMinutes((value) => Math.min(value + 5, 240))} disabled={Boolean(activeTimer)}>+5 min</button>
        </div>
      ) : null}
      <p className="mt-5 text-center text-sm text-white/80">A continuacion: <span className="font-semibold text-white">Descanso de {userSettings.timerBreakMinutes} minutos</span></p>
    </div>
  );
}
