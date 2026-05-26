import type { CalendarBlock, Subtask, Task } from "../types/domain";
import { HOUR_STATUS_LABELS, SIMPLE_TASK_PROGRESS_BY_STATUS } from "./constants";

type DateInput = string | Date;

function roundToSingleDecimal(value: number): number {
  return Number(value.toFixed(1));
}

export function calculateDisplayedProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(Math.max(Math.round(progress), 0), 100);
}

export function calculateEstimatedHoursFromSubtasks(subtasks: Pick<Subtask, "estimatedHours">[]): number {
  return roundToSingleDecimal(subtasks.reduce((total, subtask) => total + Math.max(subtask.estimatedHours, 0), 0));
}

export function calculateRealHoursFromSubtasks(subtasks: Pick<Subtask, "realHours">[]): number {
  return roundToSingleDecimal(subtasks.reduce((total, subtask) => total + Math.max(subtask.realHours, 0), 0));
}

export function calculateEstimatedHours(subtasks: Pick<Subtask, "estimatedHours">[]): number {
  return calculateEstimatedHoursFromSubtasks(subtasks);
}

export function calculateRealHours(subtasks: Pick<Subtask, "realHours">[]): number {
  return calculateRealHoursFromSubtasks(subtasks);
}

export function calculateSimpleTaskProgress(task: Pick<Task, "status" | "progress">): number {
  const mappedProgress = SIMPLE_TASK_PROGRESS_BY_STATUS[task.status];
  return mappedProgress ?? calculateDisplayedProgress(task.progress);
}

export function calculateSimpleTaskProgressWithPausedState(task: Pick<Task, "status" | "progress">): number {
  return calculateSimpleTaskProgress(task);
}

export function calculateComplexTaskProgress(subtasks: Pick<Subtask, "estimatedHours" | "realHours">[]): number {
  const estimatedHours = calculateEstimatedHoursFromSubtasks(subtasks);
  if (estimatedHours <= 0) return 0;
  const realHours = calculateRealHoursFromSubtasks(subtasks);
  return calculateDisplayedProgress((realHours / estimatedHours) * 100);
}

export function calculateTaskProgress(task: Pick<Task, "type" | "status" | "progress">, subtasks: Pick<Subtask, "estimatedHours" | "realHours">[] = []): number {
  if (task.type === "complex") return calculateComplexTaskProgress(subtasks);
  return calculateSimpleTaskProgress(task);
}

export function calculateHourDifference(estimatedHours: number, realHours: number): number {
  return roundToSingleDecimal(realHours - estimatedHours);
}

export function calculateOverconsumption(estimatedHours: number, realHours: number): number {
  return Math.max(calculateHourDifference(estimatedHours, realHours), 0);
}

export function calculateSavedHours(estimatedHours: number, realHours: number): number {
  return Math.max(roundToSingleDecimal(estimatedHours - realHours), 0);
}

export function getHourStatusLabel(estimatedHours: number, realHours: number): "Sobreconsumo" | "Ahorro" | "Exacto" {
  const difference = calculateHourDifference(estimatedHours, realHours);
  if (difference > 0) return HOUR_STATUS_LABELS.overconsumption;
  if (difference < 0) return HOUR_STATUS_LABELS.saved;
  return HOUR_STATUS_LABELS.exact;
}

export function getHourStatusVariant(estimatedHours: number, realHours: number): "error" | "success" | "neutral" {
  const label = getHourStatusLabel(estimatedHours, realHours);
  if (label === HOUR_STATUS_LABELS.overconsumption) return "error";
  if (label === HOUR_STATUS_LABELS.saved) return "success";
  return "neutral";
}

export function calculateEfficiencyPercent(estimatedHours: number, realHours: number): number {
  if (estimatedHours <= 0) return 0;
  return Math.round((realHours / estimatedHours) * 100);
}

export function calculateBlockDurationHours(startAtOrBlock: DateInput | Pick<CalendarBlock, "startAt" | "endAt">, endAt?: DateInput): number {
  const startValue = typeof startAtOrBlock === "object" && "startAt" in startAtOrBlock ? startAtOrBlock.startAt : startAtOrBlock;
  const endValue = typeof startAtOrBlock === "object" && "endAt" in startAtOrBlock ? startAtOrBlock.endAt : endAt;
  if (!endValue) return 0;

  const start = new Date(startValue).getTime();
  const end = new Date(endValue).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return roundToSingleDecimal((end - start) / (1000 * 60 * 60));
}

export function calculateSubtaskProgress(subtask: Pick<Subtask, "status" | "realHours" | "estimatedHours">): number {
  if (subtask.status === "done") return 100;
  if (subtask.estimatedHours <= 0) return 0;
  return calculateDisplayedProgress((subtask.realHours / subtask.estimatedHours) * 100);
}
