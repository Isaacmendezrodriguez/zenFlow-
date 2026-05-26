import { describe, expect, it } from "vitest";
import {
  applyManualMove,
  canApplyBlockHours,
  canArchiveCompletedTask,
  canChangeTaskProject,
  canChangeTaskType,
  canCompleteSubtask,
  canDeleteTask,
  canEditSubtask,
  canEditTask,
  canMarkSubtaskComplete,
  canMoveProjectToOrganization,
  canMoveTask,
  canPermanentlyDeleteTrashItem,
  canReopenTask,
  canRestoreArchivedTask,
  canRestoreTrashItem,
  canScheduleBlockForTask,
  completeSubtaskWithRealHours,
  createDailySummary,
  getAppliedRealHoursFromBlock,
  getBlockOverlapWarning,
  getManualMoveValidationMessage,
  getStatusFromProgress,
  getSubtaskHourStatus,
  getTrashRemainingDays,
  hasBlockOverlap,
  isBaseStatus,
  isBlockAfterDueDate,
  isOptionalStatus,
  isPausedStatus,
  isTaskArchived,
  isTaskCompleted,
  isTaskPaused,
  isTrashItemExpired,
  requiresCompletionModalWhenMoving,
  requiresProgressModalWhenMoving,
  shouldAutoMoveToDone,
  shouldAutoMoveToInProgress,
  shouldAutoMoveToNotStarted,
  shouldNotifyBeforeBlock,
  shouldNotifyDueToday,
  shouldNotifyDueTomorrow,
  shouldNotifyOverdue,
  shouldRemoveRealHoursWhenBlockDeleted,
} from "../business-rules";
import { baseProject, block, subtask, task, trashItem } from "./test-helpers";

describe("status and task state rules", () => {
  it("maps progress to status", () => {
    expect(getStatusFromProgress(0)).toBe("not_started");
    expect(getStatusFromProgress(50)).toBe("in_progress");
    expect(getStatusFromProgress(100)).toBe("done");
  });

  it("detects auto movement thresholds", () => {
    expect(shouldAutoMoveToNotStarted(0)).toBe(true);
    expect(shouldAutoMoveToInProgress(50)).toBe(true);
    expect(shouldAutoMoveToDone(100)).toBe(true);
  });

  it("classifies base, optional and paused states", () => {
    expect(isBaseStatus("not_started")).toBe(true);
    expect(isOptionalStatus("review")).toBe(true);
    expect(isPausedStatus("review")).toBe(true);
    expect(isPausedStatus("blocked")).toBe(true);
    expect(isPausedStatus("waiting")).toBe(true);
  });

  it("detects task paused, completed and archived states", () => {
    expect(isTaskPaused(task({ status: "blocked" }))).toBe(true);
    expect(isTaskCompleted(task({ status: "done" }))).toBe(true);
    expect(isTaskArchived(task({ isArchived: true }))).toBe(true);
  });
});

describe("editing and movement rules", () => {
  it("prevents editing completed and archived tasks", () => {
    expect(canEditTask(task({ status: "done" }))).toBe(false);
    expect(canEditTask(task({ isArchived: true }))).toBe(false);
    expect(canEditTask(task({ status: "in_progress" }))).toBe(true);
  });

  it("handles archive, reopen and delete rules", () => {
    expect(canArchiveCompletedTask(task({ status: "done", isArchived: false }))).toBe(true);
    expect(canReopenTask(task({ status: "done", isArchived: true }))).toBe(false);
    expect(canRestoreArchivedTask(task({ status: "done", isArchived: true }))).toBe(false);
    expect(canDeleteTask(task({ isArchived: false }))).toBe(true);
    expect(canDeleteTask(task({ isArchived: true }))).toBe(false);
  });

  it("does not allow changing task type or project", () => {
    expect(canChangeTaskType(task({ type: "simple" }), "complex")).toBe(false);
    expect(canChangeTaskProject(task({ projectId: "project-1" }), "project-2")).toBe(false);
  });

  it("allows moving project organization when target is valid and different", () => {
    expect(canMoveProjectToOrganization(baseProject, "org-2")).toBe(true);
    expect(canMoveProjectToOrganization(baseProject, "org-1")).toBe(false);
  });

  it("prevents movement for read-only tasks", () => {
    expect(canMoveTask(task({ status: "done" }), "in_progress")).toBe(false);
    expect(canMoveTask(task({ status: "in_progress" }), "review")).toBe(true);
  });

  it("controls subtask editing from parent task state", () => {
    expect(canEditSubtask(task({ status: "done" }))).toBe(false);
    expect(canCompleteSubtask(task({ status: "in_progress" }), subtask({ status: "in_progress" }))).toBe(true);
  });
});

describe("calendar rules", () => {
  it("blocks scheduling after due date", () => {
    const calendarBlock = block({ endAt: "2026-05-25T09:00:00-06:00" });
    const parentTask = task({ dueDate: "2026-05-24" });
    expect(isBlockAfterDueDate(calendarBlock, parentTask)).toBe(true);
    expect(canScheduleBlockForTask(calendarBlock, parentTask).canSchedule).toBe(false);
    expect(canScheduleBlockForTask(calendarBlock, parentTask).warning).toContain("No puedes programar horas");
  });

  it("returns overlap warning while allowing overlap upstream", () => {
    const warning = getBlockOverlapWarning(block(), [block({ id: "block-2", startAt: "2026-05-24T10:00:00-06:00", endAt: "2026-05-24T12:00:00-06:00" })]);
    expect(hasBlockOverlap(block(), [block({ id: "block-2", startAt: "2026-05-24T10:00:00-06:00", endAt: "2026-05-24T12:00:00-06:00" })])).toBe(true);
    expect(warning).toContain("Ya tienes una actividad programada");
  });

  it("applies real hours only for completed linked non-free blocks", () => {
    const completedLinked = block({ status: "completed", taskId: "task-1", realHoursApplied: 1.5 });
    expect(canApplyBlockHours(completedLinked)).toBe(true);
    expect(getAppliedRealHoursFromBlock(completedLinked)).toBe(1.5);
    expect(canApplyBlockHours(block({ status: "completed", blockType: "free" }))).toBe(false);
  });

  it("removes real hours when a completed linked block is deleted", () => {
    expect(shouldRemoveRealHoursWhenBlockDeleted(block({ status: "completed", taskId: "task-1", realHoursApplied: 2, deletedAt: "2026-05-24T12:00:00Z" }))).toBe(true);
  });
});

describe("manual movement rules", () => {
  it("requires progress modal for complex not_started to in_progress", () => {
    const complexTask = task({ type: "complex", status: "not_started" });
    expect(requiresProgressModalWhenMoving(complexTask, "in_progress")).toBe(true);
    expect(getManualMoveValidationMessage(complexTask, "in_progress")).toContain("Registra");
  });

  it("requires completion modal for complex tasks moved to done", () => {
    const complexTask = task({ type: "complex", status: "in_progress" });
    expect(requiresCompletionModalWhenMoving(complexTask, "done")).toBe(true);
    expect(getManualMoveValidationMessage(complexTask, "done")).toContain("Confirma");
  });

  it("moves simple tasks to done with progress 100 and pauses progress in optional states", () => {
    expect(applyManualMove(task({ status: "in_progress", progress: 50 }), "done").progress).toBe(100);
    const movedToReview = applyManualMove(task({ status: "in_progress", progress: 40 }), "review");
    expect(movedToReview.status).toBe("review");
    expect(movedToReview.progress).toBe(40);
  });
});

describe("subtask completion rules", () => {
  it("requires real hours before completing a subtask", () => {
    expect(canMarkSubtaskComplete(task({ status: "in_progress" }), subtask({ status: "in_progress" }))).toBe(true);
  });

  it("completes subtask with real hours", () => {
    const completed = completeSubtaskWithRealHours(subtask({ status: "in_progress", realHours: 0 }), 1.5);
    expect(completed.status).toBe("done");
    expect(completed.realHours).toBe(1.5);
  });

  it("returns subtask hour status", () => {
    expect(getSubtaskHourStatus(subtask({ estimatedHours: 4, realHours: 3 }))).toBe("Ahorro");
    expect(getSubtaskHourStatus(subtask({ estimatedHours: 4, realHours: 5 }))).toBe("Sobreconsumo");
  });
});

describe("archive, trash and notifications", () => {
  it("calculates trash remaining days and expiration", () => {
    expect(getTrashRemainingDays(trashItem(), new Date("2026-05-21T00:00:00Z"))).toBe(2);
    expect(isTrashItemExpired(trashItem(), new Date("2026-05-24T00:00:00Z"))).toBe(true);
    expect(canRestoreTrashItem(trashItem(), new Date("2026-05-21T00:00:00Z"))).toBe(true);
    expect(canPermanentlyDeleteTrashItem(trashItem(), new Date("2026-05-24T00:00:00Z"))).toBe(true);
  });

  it("notifies before block, due tomorrow, due today and overdue", () => {
    const now = new Date("2026-05-24T08:55:00-06:00");
    expect(shouldNotifyBeforeBlock(block({ startAt: "2026-05-24T09:00:00-06:00" }), now, 5)).toBe(true);
    expect(shouldNotifyDueTomorrow(task({ dueDate: "2026-05-25" }), now)).toBe(true);
    expect(shouldNotifyDueToday(task({ dueDate: "2026-05-24" }), now)).toBe(true);
    expect(shouldNotifyOverdue(task({ dueDate: "2026-05-23" }), now)).toBe(true);
  });

  it("creates daily summary", () => {
    const now = new Date("2026-05-24T08:00:00-06:00");
    const summary = createDailySummary(
      [task({ priority: "urgent", dueDate: "2026-05-25" }), task({ priority: "medium", dueDate: "2026-05-23" })],
      [block({ startAt: "2026-05-24T09:00:00-06:00", endAt: "2026-05-24T11:00:00-06:00" })],
      now,
    );
    expect(summary.scheduledBlocksToday).toBe(1);
    expect(summary.plannedHoursToday).toBe(2);
    expect(summary.urgentTasks).toBe(1);
    expect(summary.tasksDueTomorrow).toBe(1);
    expect(summary.overdueTasks).toBe(1);
  });
});
