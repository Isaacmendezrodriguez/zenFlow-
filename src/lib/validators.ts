import { z } from "zod";
import type { Subtask, Task } from "../types/domain";
import {
  getTaskValidationErrors,
  validateComplexTaskCreation,
  validateSimpleTaskCreation,
  validateTaskCreation,
  validateTaskPlanningCompleteness,
} from "./business-rules";

export const subtaskCreationSchema = z.object({
  title: z.string().min(1, "El titulo de la subtarea es requerido"),
  description: z.string().optional(),
  estimatedHours: z.coerce.number().positive("Las horas estimadas deben ser mayores a cero"),
  priority: z.enum(["urgent", "medium", "low"]),
});

export const addTaskSchema = z.object({
  title: z.string().min(1, "El titulo es requerido"),
  description: z.string().min(1, "La descripcion es requerida"),
  type: z.enum(["simple", "complex"]),
  organizationId: z.string().optional(),
  projectId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["urgent", "medium", "low"]),
  subtasks: z.array(subtaskCreationSchema).optional(),
});

export type AddTaskFormValues = z.infer<typeof addTaskSchema>;

export function validateSimpleTaskInput(task: Pick<Task, "title" | "description">) {
  return validateSimpleTaskCreation(task);
}

export function validateComplexTaskInput(
  task: Pick<Task, "title" | "description" | "organizationId" | "projectId" | "dueDate">,
  subtasks: Pick<Subtask, "title" | "estimatedHours">[],
) {
  return validateComplexTaskCreation({ ...task, subtasks });
}

export function validateTaskPlanningInput(task: Pick<Task, "organizationId" | "projectId">) {
  return validateTaskPlanningCompleteness(task);
}

export function validateTaskInput(
  task: Pick<Task, "type" | "title" | "description" | "organizationId" | "projectId" | "dueDate">,
  subtasks: Pick<Subtask, "title" | "estimatedHours">[] = [],
) {
  return validateTaskCreation({ ...task, subtasks });
}

export function getTaskInputValidationErrors(
  task: Pick<Task, "type" | "title" | "description" | "organizationId" | "projectId" | "dueDate">,
  subtasks: Pick<Subtask, "title" | "estimatedHours">[] = [],
) {
  return getTaskValidationErrors({ ...task, subtasks });
}
