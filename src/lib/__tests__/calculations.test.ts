import { describe, expect, it } from "vitest";
import {
  calculateBlockDurationHours,
  calculateComplexTaskProgress,
  calculateDisplayedProgress,
  calculateEstimatedHoursFromSubtasks,
  calculateHourDifference,
  calculateOverconsumption,
  calculateRealHoursFromSubtasks,
  calculateSavedHours,
  calculateSimpleTaskProgress,
  calculateSubtaskProgress,
  calculateTaskProgress,
  getHourStatusLabel,
  getHourStatusVariant,
} from "../calculations";
import { baseSubtasks, subtask, task } from "./test-helpers";

describe("task progress calculations", () => {
  it("calculates simple progress from status", () => {
    expect(calculateSimpleTaskProgress(task({ status: "not_started" }))).toBe(0);
    expect(calculateSimpleTaskProgress(task({ status: "in_progress" }))).toBe(50);
    expect(calculateSimpleTaskProgress(task({ status: "done" }))).toBe(100);
  });

  it("keeps paused simple task progress", () => {
    expect(calculateSimpleTaskProgress(task({ status: "review", progress: 35 }))).toBe(35);
    expect(calculateSimpleTaskProgress(task({ status: "blocked", progress: 45 }))).toBe(45);
    expect(calculateSimpleTaskProgress(task({ status: "waiting", progress: 55 }))).toBe(55);
  });

  it("calculates complex progress from real hours over estimated hours", () => {
    expect(calculateComplexTaskProgress(baseSubtasks)).toBe(67);
  });

  it("caps displayed complex progress at 100 while real hours can exceed estimated hours", () => {
    const subtasks = [subtask({ estimatedHours: 2, realHours: 5 })];
    expect(calculateRealHoursFromSubtasks(subtasks)).toBe(5);
    expect(calculateComplexTaskProgress(subtasks)).toBe(100);
    expect(calculateDisplayedProgress(140)).toBe(100);
  });

  it("calculates task progress by task type", () => {
    expect(calculateTaskProgress(task({ type: "simple", status: "in_progress" }))).toBe(50);
    expect(calculateTaskProgress(task({ type: "complex" }), baseSubtasks)).toBe(67);
  });
});

describe("hour calculations", () => {
  it("calculates estimated and real hours from subtasks", () => {
    expect(calculateEstimatedHoursFromSubtasks(baseSubtasks)).toBe(6);
    expect(calculateRealHoursFromSubtasks(baseSubtasks)).toBe(4);
  });

  it("calculates overconsumption", () => {
    expect(calculateHourDifference(10, 12)).toBe(2);
    expect(calculateOverconsumption(10, 12)).toBe(2);
    expect(getHourStatusLabel(10, 12)).toBe("Sobreconsumo");
    expect(getHourStatusVariant(10, 12)).toBe("error");
  });

  it("calculates savings", () => {
    expect(calculateHourDifference(10, 7)).toBe(-3);
    expect(calculateSavedHours(10, 7)).toBe(3);
    expect(getHourStatusLabel(10, 7)).toBe("Ahorro");
    expect(getHourStatusVariant(10, 7)).toBe("success");
  });

  it("handles exact match", () => {
    expect(calculateHourDifference(10, 10)).toBe(0);
    expect(getHourStatusLabel(10, 10)).toBe("Exacto");
    expect(getHourStatusVariant(10, 10)).toBe("neutral");
  });

  it("calculates calendar block duration from 09:00 to 11:00 as 2 hours", () => {
    expect(calculateBlockDurationHours("2026-05-24T09:00:00-06:00", "2026-05-24T11:00:00-06:00")).toBe(2);
  });

  it("calculates subtask progress", () => {
    expect(calculateSubtaskProgress(subtask({ status: "done", estimatedHours: 4, realHours: 1 }))).toBe(100);
    expect(calculateSubtaskProgress(subtask({ status: "in_progress", estimatedHours: 4, realHours: 1 }))).toBe(25);
  });
});
