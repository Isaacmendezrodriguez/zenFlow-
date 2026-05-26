import { ChevronLeft, Coffee, Maximize2, MoreHorizontal, Pause, Play, Square, Timer, X } from "lucide-react";
import { useState } from "react";
import { useZenflowStore } from "../../state/zenflow-store";
import { Input } from "../../components/ui/Input";

export function TimerWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [timerMinutes, setTimerMinutes] = useState(60);
  const calendarBlocks = useZenflowStore((state) => state.calendarBlocks);
  const activeTimer = useZenflowStore((state) => state.activeTimer);
  const startTimer = useZenflowStore((state) => state.startTimer);
  const stopTimer = useZenflowStore((state) => state.stopTimer);
  const activeBlock = calendarBlocks.find((block) => block.id === activeTimer?.blockId) ?? calendarBlocks.find((block) => block.status === "in_progress");
  const availableBlocks = calendarBlocks.filter((block) => block.status !== "completed" && block.status !== "cancelled");
  const timerTitle = activeBlock?.title ?? "Timer ZenFlow";

  function beginTimer() {
    const blockId = selectedBlockId || availableBlocks[0]?.id;
    if (blockId) startTimer(blockId);
  }

  if (!isExpanded) {
    return (
      <button
        className="fixed bottom-4 right-0 z-30 flex h-11 max-w-[12rem] items-center gap-2 rounded-l-xl border border-r-0 border-outline-variant bg-surface-container-lowest px-3 text-on-surface shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition hover:-translate-x-1 dark:border-white/10 dark:bg-[#111318] dark:text-white"
        onClick={() => setIsExpanded(true)}
        aria-label="Expandir timer activo"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary dark:bg-[#1b2421] dark:text-[#7bd88f]">
          <Timer className="h-4 w-4" />
        </span>
        <span className="min-w-0 text-left leading-none">
          <span className="block max-w-20 truncate text-[10px] font-semibold text-primary dark:text-[#72c58a]">{timerTitle}</span>
          <span className="block font-mono text-xs font-semibold">{activeTimer ? "00:25" : `${timerMinutes}:00`}</span>
        </span>
        <ChevronLeft className="h-4 w-4 shrink-0 text-on-surface-variant dark:text-white/70" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-30 w-[calc(100vw-2rem)] max-w-[360px] rounded-xl border border-white/10 bg-[#1f2229] p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <div className="mb-3 flex items-center justify-between">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10"
          onClick={() => setIsExpanded(false)}
          aria-label="Minimizar timer"
        >
          <Maximize2 className="h-4 w-4 rotate-180" />
        </button>
        <div className="min-w-0 px-3 text-center">
          <p className="truncate text-sm font-medium text-white">Periodo de concentracion {activeTimer ? "(1 de 2)" : ""}</p>
        </div>
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10" onClick={() => setIsExpanded(false)} aria-label="Cerrar timer">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_5rem]">
        <select
          value={selectedBlockId || availableBlocks[0]?.id || ""}
          onChange={(event) => setSelectedBlockId(event.target.value)}
          className="h-10 w-full rounded-lg border border-white/10 bg-[#2a2d35] px-3 text-sm text-white outline-none transition focus:border-[#4cc9f0] focus:ring-2 focus:ring-[#4cc9f0]/20"
        >
          <option value="" disabled>Selecciona bloque</option>
          {availableBlocks.map((block) => <option key={block.id} value={block.id}>{block.title}</option>)}
        </select>
        <Input className="h-9 border-white/10 bg-[#2a2d35] text-white" type="number" min={5} step={5} value={timerMinutes} onChange={(event) => setTimerMinutes(Number(event.target.value))} />
      </div>
      <div className="mx-auto mt-5 flex h-28 w-28 items-center justify-center rounded-full bg-[#2b2e36] shadow-inner">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-[10px] border-[#373b44]">
          <div className="absolute inset-2 rounded-full border border-dashed border-white/10" />
          <Coffee className="h-8 w-8 text-[#4cc9f0]" />
        </div>
      </div>
      <div className="mt-4 text-center font-mono text-3xl font-semibold leading-none text-white">{activeTimer ? "45:22" : `${timerMinutes}:00`}</div>
      <div className="mt-4 flex items-center justify-center gap-3">
        <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4cc9f0] text-[#101318] shadow-lg transition hover:scale-105" aria-label="Iniciar timer" onClick={beginTimer}>
          {activeTimer ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
        </button>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15" aria-label="Mas opciones">
          <MoreHorizontal className="h-5 w-5" />
        </button>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15" aria-label="Finalizar timer" onClick={stopTimer}>
          <Square className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-5 text-center text-sm text-white/80">A continuacion: <span className="font-semibold text-white">Descanso de 5 minutos</span></p>
    </div>
  );
}
