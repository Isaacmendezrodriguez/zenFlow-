import type { CalendarBlock, Project, Subtask, Task, TaskStatus, TaskType, TrashItem } from "../types/domain";
import {
  calculateBlockDurationHours,
  calculateComplexTaskProgress,
  calculateDisplayedProgress,
  calculateEstimatedHoursFromSubtasks,
  calculateRealHoursFromSubtasks,
  calculateSubtaskProgress,
  calculateTaskProgress as calculateTaskProgressValue,
  getHourStatusLabel,
} from "./calculations";
import { BASE_STATUSES, CALENDAR_OVERLAP_WARNING, OPTIONAL_STATUSES, PAUSED_STATUSES, TASK_DUE_DATE_SCHEDULE_ERROR } from "./constants";
import { diffHours, isPastDate, isSameDay, isTomorrow } from "./dates";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface CalendarScheduleResult {
  canSchedule: boolean;
  warning?: string;
}

export interface ManualMovePayload {
  subtaskId?: string;
  realHours?: number;
  comment?: string;
  confirmAllSubtasksComplete?: boolean;
  pendingSubtaskHours?: Record<string, number>;
}

export interface DailySummary {
  scheduledBlocksToday: number;
  plannedHoursToday: number;
  urgentTasks: number;
  tasksDueTomorrow: number;
  overdueTasks: number;
}

function result(errors: ValidationError[]): ValidationResult {
  return {
    isValid: errors.length === 0,
    errors,
  };
}

function requiredText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function linkedBlock(block: Pick<CalendarBlock, "taskId" | "subtaskId" | "blockType">): boolean {
  return block.blockType !== "free" && Boolean(block.taskId || block.subtaskId);
}

export function getStatusFromProgress(progress: number): TaskStatus {
  if (progress <= 0) return "not_started";
  if (progress >= 100) return "done";
  return "in_progress";
}

export function getTaskStatusFromProgress(progress: number): TaskStatus {
  return getStatusFromProgress(progress);
}

export function shouldAutoMoveToDone(progress: number): boolean {
  return progress >= 100;
}

export function shouldAutoMoveToInProgress(progress: number): boolean {
  return progress > 0 && progress < 100;
}

export function shouldAutoMoveToNotStarted(progress: number): boolean {
  return progress <= 0;
}

export function isPausedStatus(status: TaskStatus): boolean {
  return (PAUSED_STATUSES as readonly TaskStatus[]).includes(status);
}

export function isBaseStatus(status: TaskStatus): boolean {
  return (BASE_STATUSES as readonly TaskStatus[]).includes(status);
}

export function isOptionalStatus(status: TaskStatus): boolean {
  return (OPTIONAL_STATUSES as readonly TaskStatus[]).includes(status);
}

export function calculateTaskProgress(task: Pick<Task, "type" | "status" | "progress">, subtasks: Pick<Subtask, "estimatedHours" | "realHours">[] = []): number {
  if (isPausedStatus(task.status)) return calculateDisplayedProgress(task.progress);
  return calculateTaskProgressValue(task, subtasks);
}

export function getTaskProgress(task: Task, subtasks: Subtask[]): number {
  return calculateTaskProgress(task, subtasks.filter((subtask) => subtask.taskId === task.id));
}

export function isTaskPaused(task: Pick<Task, "status">): boolean {
  return isPausedStatus(task.status);
}

export function isTaskCompleted(task: Pick<Task, "status">): boolean {
  return task.status === "done";
}

export function isTaskArchived(task: Pick<Task, "isArchived">): boolean {
  return task.isArchived;
}

export function canEditTask(task: Pick<Task, "status" | "isArchived" | "deletedAt">): boolean {
  return task.status !== "done" && !task.isArchived && !task.deletedAt;
}

export function canArchiveTask(task: Pick<Task, "status" | "isArchived" | "deletedAt">): boolean {
  return task.status === "done" && !task.isArchived && !task.deletedAt;
}

export function canArchiveCompletedTask(task: Pick<Task, "status" | "isArchived" | "deletedAt">): boolean {
  return canArchiveTask(task);
}

export function canReopenTask(task: Pick<Task, "status" | "isArchived" | "deletedAt">): boolean {
  return task.status === "done" && !task.isArchived && !task.deletedAt;
}

export function canDeleteTask(task: Pick<Task, "isArchived" | "deletedAt">): boolean {
  return !task.isArchived && !task.deletedAt;
}

export function canMoveTask(task: Pick<Task, "status" | "isArchived" | "deletedAt">, targetStatus: TaskStatus): boolean {
  if (!canEditTask(task)) return false;
  return task.status !== targetStatus || isPausedStatus(targetStatus);
}

export function canChangeTaskType(_task: Pick<Task, "type">, _newType: TaskType): false {
  return false;
}

export function canChangeTaskProject(_task: Pick<Task, "projectId">, _newProjectId: Task["projectId"]): false {
  return false;
}

export function canMoveProjectToOrganization(project: Pick<Project, "id" | "organizationId"> | undefined, newOrganizationId: Project["organizationId"] | undefined): boolean {
  return Boolean(project?.id && newOrganizationId && project.organizationId !== newOrganizationId);
}

export function canMoveProjectOrganization(project: Pick<Project, "organizationId">, nextOrganizationId: Project["organizationId"]): boolean {
  return canMoveProjectToOrganization({ id: "project", organizationId: project.organizationId }, nextOrganizationId);
}

export function canEditSubtask(parentTask: Pick<Task, "status" | "isArchived" | "deletedAt">): boolean {
  return canEditTask(parentTask);
}

export function canCompleteSubtask(parentTask: Pick<Task, "status" | "isArchived" | "deletedAt">, subtask: Pick<Subtask, "status">): boolean {
  return canEditSubtask(parentTask) && subtask.status !== "done";
}

export function validateSimpleTaskCreation(input: Pick<Task, "title" | "description">): ValidationResult {
  const errors: ValidationError[] = [];
  if (!requiredText(input.title)) errors.push({ field: "title", message: "El titulo es obligatorio" });
  if (!requiredText(input.description)) errors.push({ field: "description", message: "La descripcion es obligatoria" });
  return result(errors);
}

export function validateComplexTaskCreation(
  input: Pick<Task, "title" | "description" | "organizationId" | "projectId" | "dueDate"> & {
    subtasks?: Pick<Subtask, "title" | "estimatedHours">[];
  },
): ValidationResult {
  const errors = [...validateSimpleTaskCreation(input).errors];
  const subtasks = input.subtasks ?? [];

  if (!input.organizationId) errors.push({ field: "organizationId", message: "La organizacion es obligatoria" });
  if (!input.projectId) errors.push({ field: "projectId", message: "El proyecto es obligatorio" });
  if (!input.dueDate) errors.push({ field: "dueDate", message: "La fecha de entrega es obligatoria" });
  if (subtasks.length === 0) errors.push({ field: "subtasks", message: "Agrega al menos una subtarea" });

  subtasks.forEach((subtask, index) => {
    if (!requiredText(subtask.title)) errors.push({ field: `subtasks.${index}.title`, message: "El titulo de la subtarea es obligatorio" });
    if (subtask.estimatedHours <= 0) errors.push({ field: `subtasks.${index}.estimatedHours`, message: "Las horas estimadas deben ser mayores a 0" });
  });

  return result(errors);
}

export function validateTaskPlanningCompleteness(task: Pick<Task, "organizationId" | "projectId">): ValidationResult {
  const errors: ValidationError[] = [];
  if (!task.organizationId) errors.push({ field: "organizationId", message: "Una tarea completa necesita organizacion" });
  if (!task.projectId) errors.push({ field: "projectId", message: "Una tarea completa necesita proyecto" });
  return result(errors);
}

export function validateTaskCreation(
  input: Pick<Task, "type" | "title" | "description" | "organizationId" | "projectId" | "dueDate"> & {
    subtasks?: Pick<Subtask, "title" | "estimatedHours">[];
  },
): ValidationResult {
  return input.type === "complex" ? validateComplexTaskCreation(input) : validateSimpleTaskCreation(input);
}

export function getTaskValidationErrors(input: Parameters<typeof validateTaskCreation>[0]): ValidationError[] {
  return validateTaskCreation(input).errors;
}

export function canTaskAppearInWeeklyTodo(task: Pick<Task, "organizationId" | "projectId" | "dueDate" | "deletedAt" | "isArchived">): boolean {
  return Boolean(task.organizationId && task.projectId && task.dueDate && !task.deletedAt && !task.isArchived);
}

export function isBlockAfterDueDate(block: Pick<CalendarBlock, "endAt">, task: Pick<Task, "dueDate"> | undefined): boolean {
  if (!task?.dueDate) return false;
  return new Date(block.endAt).getTime() > new Date(`${task.dueDate}T23:59:59`).getTime();
}

export function canScheduleBlockForTask(block: Pick<CalendarBlock, "endAt">, task: Pick<Task, "dueDate"> | undefined): CalendarScheduleResult {
  if (isBlockAfterDueDate(block, task)) {
    return {
      canSchedule: false,
      warning: TASK_DUE_DATE_SCHEDULE_ERROR,
    };
  }
  return { canSchedule: true };
}

export function canScheduleBlock(block: Pick<CalendarBlock, "endAt">, task?: Pick<Task, "dueDate">): boolean {
  return canScheduleBlockForTask(block, task).canSchedule;
}

export function hasBlockOverlap(block: Pick<CalendarBlock, "id" | "startAt" | "endAt">, existingBlocks: Pick<CalendarBlock, "id" | "startAt" | "endAt">[]): boolean {
  const start = new Date(block.startAt).getTime();
  const end = new Date(block.endAt).getTime();
  return existingBlocks.some((existingBlock) => {
    if (existingBlock.id === block.id) return false;
    const existingStart = new Date(existingBlock.startAt).getTime();
    const existingEnd = new Date(existingBlock.endAt).getTime();
    return start < existingEnd && end > existingStart;
  });
}

export function getBlockOverlapWarning(block: Pick<CalendarBlock, "id" | "startAt" | "endAt">, existingBlocks: Pick<CalendarBlock, "id" | "startAt" | "endAt">[]): string | undefined {
  return hasBlockOverlap(block, existingBlocks) ? CALENDAR_OVERLAP_WARNING : undefined;
}

export { calculateBlockDurationHours };

export function canApplyBlockHours(block: Pick<CalendarBlock, "status" | "taskId" | "subtaskId" | "blockType">): boolean {
  return block.status === "completed" && linkedBlock(block);
}

export function getAppliedRealHoursFromBlock(block: Pick<CalendarBlock, "status" | "taskId" | "subtaskId" | "blockType" | "realHoursApplied" | "durationHours">): number {
  if (!canApplyBlockHours(block)) return 0;
  return block.realHoursApplied > 0 ? block.realHoursApplied : block.durationHours;
}

export function shouldRemoveRealHoursWhenBlockDeleted(block: Pick<CalendarBlock, "status" | "taskId" | "subtaskId" | "blockType" | "realHoursApplied" | "deletedAt">): boolean {
  return Boolean(block.deletedAt) && block.realHoursApplied > 0 && canApplyBlockHours(block);
}

export function shouldRemoveAppliedHoursWhenDeletingBlock(block: Pick<CalendarBlock, "status" | "taskId" | "subtaskId" | "blockType" | "realHoursApplied">): boolean {
  return block.realHoursApplied > 0 && canApplyBlockHours(block);
}

export function requiresProgressModalWhenMoving(task: Pick<Task, "type" | "status">, targetStatus: TaskStatus): boolean {
  return task.type === "complex" && task.status === "not_started" && targetStatus === "in_progress";
}

export function requiresCompletionModalWhenMoving(task: Pick<Task, "type">, targetStatus: TaskStatus): boolean {
  return task.type === "complex" && targetStatus === "done";
}

export function getManualMoveValidationMessage(task: Pick<Task, "type" | "status" | "isArchived" | "deletedAt">, targetStatus: TaskStatus): string | undefined {
  if (!canMoveTask(task, targetStatus)) return "Esta tarea no se puede mover.";
  if (requiresProgressModalWhenMoving(task, targetStatus)) return "Registra la subtarea trabajada y las horas reales.";
  if (requiresCompletionModalWhenMoving(task, targetStatus)) return "Confirma subtareas completas y horas reales pendientes.";
  return undefined;
}

export function applyManualMove(task: Task, targetStatus: TaskStatus, payload: ManualMovePayload = {}): Task {
  if (!canMoveTask(task, targetStatus)) return task;
  if (requiresProgressModalWhenMoving(task, targetStatus) && (!payload.subtaskId || !payload.realHours || payload.realHours <= 0)) return task;
  if (requiresCompletionModalWhenMoving(task, targetStatus) && !payload.confirmAllSubtasksComplete) return task;

  const nextProgress = targetStatus === "done" ? 100 : isPausedStatus(targetStatus) ? task.progress : task.progress;
  return {
    ...task,
    status: targetStatus,
    progress: nextProgress,
    completedAt: targetStatus === "done" ? new Date().toISOString() : task.completedAt,
  };
}

export function canMarkSubtaskComplete(parentTask: Pick<Task, "status" | "isArchived" | "deletedAt">, subtask: Pick<Subtask, "status">): boolean {
  return canCompleteSubtask(parentTask, subtask);
}

export function requiresRealHoursBeforeCompletingSubtask(_parentTask: Pick<Task, "status" | "isArchived" | "deletedAt">, subtask: Pick<Subtask, "status" | "realHours">): boolean {
  return subtask.status !== "done" && subtask.realHours <= 0;
}

export function completeSubtaskWithRealHours(subtask: Subtask, realHours: number): Subtask {
  if (realHours <= 0) return subtask;
  return {
    ...subtask,
    status: "done",
    realHours,
    progress: 100,
    completedAt: new Date().toISOString(),
  };
}

export { calculateSubtaskProgress };

export function getSubtaskHourStatus(subtask: Pick<Subtask, "estimatedHours" | "realHours">): "Sobreconsumo" | "Ahorro" | "Exacto" {
  return getHourStatusLabel(subtask.estimatedHours, subtask.realHours);
}

export function canRestoreArchivedTask(_task: Pick<Task, "isArchived">): false {
  return false;
}

export function getTrashRemainingDays(trashItem: Pick<TrashItem, "permanentDeleteAt">, now = new Date()): number {
  const remainingMs = new Date(trashItem.permanentDeleteAt).getTime() - now.getTime();
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
}

export function isTrashItemExpired(trashItem: Pick<TrashItem, "permanentDeleteAt">, now = new Date()): boolean {
  return getTrashRemainingDays(trashItem, now) === 0;
}

export function canRestoreTrashItem(trashItem: Pick<TrashItem, "permanentDeleteAt">, now = new Date()): boolean {
  return !isTrashItemExpired(trashItem, now);
}

export function canPermanentlyDeleteTrashItem(trashItem: Pick<TrashItem, "permanentDeleteAt">, now = new Date()): boolean {
  return isTrashItemExpired(trashItem, now);
}

export function shouldNotifyBeforeBlock(block: Pick<CalendarBlock, "startAt" | "status">, now = new Date(), minutesBefore = 5): boolean {
  if (block.status !== "scheduled") return false;
  const minutesUntilStart = (new Date(block.startAt).getTime() - now.getTime()) / (1000 * 60);
  return minutesUntilStart > 0 && minutesUntilStart <= minutesBefore;
}

export function shouldNotifyDueTomorrow(task: Pick<Task, "dueDate" | "status" | "isArchived" | "deletedAt">, now = new Date()): boolean {
  return Boolean(task.dueDate && task.status !== "done" && !task.isArchived && !task.deletedAt && isTomorrow(task.dueDate, now));
}

export function shouldNotifyDueToday(task: Pick<Task, "dueDate" | "status" | "isArchived" | "deletedAt">, now = new Date()): boolean {
  return Boolean(task.dueDate && task.status !== "done" && !task.isArchived && !task.deletedAt && isSameDay(task.dueDate, now));
}

export function shouldNotifyOverdue(task: Pick<Task, "dueDate" | "status" | "isArchived" | "deletedAt">, now = new Date()): boolean {
  return Boolean(task.dueDate && task.status !== "done" && !task.isArchived && !task.deletedAt && isPastDate(task.dueDate, now));
}

export function createDailySummary(tasks: Pick<Task, "dueDate" | "status" | "priority" | "isArchived" | "deletedAt">[], blocks: Pick<CalendarBlock, "startAt" | "endAt" | "status">[], now = new Date()): DailySummary {
  const scheduledToday = blocks.filter((block) => block.status === "scheduled" && isSameDay(block.startAt, now));
  return {
    scheduledBlocksToday: scheduledToday.length,
    plannedHoursToday: Number(scheduledToday.reduce((total, block) => total + diffHours(block.startAt, block.endAt), 0).toFixed(1)),
    urgentTasks: tasks.filter((task) => task.priority === "urgent" && task.status !== "done" && !task.isArchived && !task.deletedAt).length,
    tasksDueTomorrow: tasks.filter((task) => shouldNotifyDueTomorrow(task, now)).length,
    overdueTasks: tasks.filter((task) => shouldNotifyOverdue(task, now)).length,
  };
}

export function isProjectChangeAllowed(): false {
  return false;
}

export function isTaskTypeChangeAllowed(): false {
  return false;
}

export function calculateTaskEstimatedHours(task: Task, subtasks: Subtask[]): number {
  if (task.type === "complex") return calculateEstimatedHoursFromSubtasks(subtasks.filter((subtask) => subtask.taskId === task.id));
  return task.estimatedHours;
}

export function calculateTaskRealHours(task: Task, subtasks: Subtask[]): number {
  if (task.type === "complex") return calculateRealHoursFromSubtasks(subtasks.filter((subtask) => subtask.taskId === task.id));
  return task.realHours;
}
