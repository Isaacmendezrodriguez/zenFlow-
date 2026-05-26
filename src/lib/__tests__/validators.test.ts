import { describe, expect, it } from "vitest";
import {
  canTaskAppearInWeeklyTodo,
  getTaskValidationErrors,
  validateComplexTaskCreation,
  validateSimpleTaskCreation,
  validateTaskCreation,
  validateTaskPlanningCompleteness,
} from "../business-rules";
import { getTaskInputValidationErrors, validateComplexTaskInput, validateSimpleTaskInput, validateTaskInput, validateTaskPlanningInput } from "../validators";
import { task } from "./test-helpers";

describe("task creation validation", () => {
  it("allows simple task with title and description", () => {
    expect(validateSimpleTaskCreation(task({ title: "Simple", description: "Quick" })).isValid).toBe(true);
    expect(validateSimpleTaskInput(task({ title: "Simple", description: "Quick" })).isValid).toBe(true);
  });

  it("rejects complex task without subtasks", () => {
    const validation = validateComplexTaskCreation({ ...task({ type: "complex" }), subtasks: [] });
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((error) => error.field === "subtasks")).toBe(true);
  });

  it("rejects complex task with subtask estimated hours 0", () => {
    const validation = validateComplexTaskInput(task({ type: "complex" }), [{ title: "Subtask", estimatedHours: 0 }]);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((error) => error.field === "subtasks.0.estimatedHours")).toBe(true);
  });

  it("validates generic task creation", () => {
    expect(validateTaskCreation({ ...task({ type: "simple" }), subtasks: [] }).isValid).toBe(true);
    expect(validateTaskInput(task({ type: "complex" }), [{ title: "Subtask", estimatedHours: 2 }]).isValid).toBe(true);
  });

  it("requires organization and project for complete planned tasks", () => {
    expect(validateTaskPlanningCompleteness(task({ organizationId: "org-1", projectId: "project-1" })).isValid).toBe(true);
    expect(validateTaskPlanningInput(task({ projectId: undefined })).isValid).toBe(false);
  });

  it("does not show tasks without planning in weekly todo", () => {
    expect(canTaskAppearInWeeklyTodo(task({ organizationId: undefined, projectId: undefined, dueDate: undefined }))).toBe(false);
    expect(canTaskAppearInWeeklyTodo(task({ organizationId: "org-1", projectId: "project-1", dueDate: "2026-05-24" }))).toBe(true);
  });

  it("returns structured validation errors", () => {
    const errors = getTaskValidationErrors({ ...task({ title: "", type: "simple" }), subtasks: [] });
    const wrappedErrors = getTaskInputValidationErrors(task({ title: "", type: "simple" }));
    expect(errors[0]).toEqual({ field: "title", message: "El titulo es obligatorio" });
    expect(wrappedErrors[0]?.field).toBe("title");
  });
});
