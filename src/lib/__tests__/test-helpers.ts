import type { CalendarBlock, Project, Subtask, Task, TrashItem } from "../../types/domain";

export const baseTask: Task = {
  id: "task-1",
  userId: "user-1",
  organizationId: "org-1",
  projectId: "project-1",
  title: "Task",
  description: "Description",
  type: "simple",
  status: "not_started",
  statusIndex: 0,
  priority: "medium",
  dueDate: "2026-05-24",
  estimatedHours: 0,
  realHours: 0,
  progress: 0,
  tags: [],
  isArchived: false,
  createdAt: "2026-05-01T10:00:00Z",
};

export const baseProject: Project = {
  id: "project-1",
  userId: "user-1",
  organizationId: "org-1",
  name: "Project",
  color: "#1f108e",
  tags: [],
  createdAt: "2026-05-01T10:00:00Z",
};

export const baseSubtasks: Subtask[] = [
  {
    id: "subtask-1",
    userId: "user-1",
    taskId: "task-1",
    title: "Research",
    priority: "medium",
    status: "done",
    estimatedHours: 2,
    realHours: 3,
    progress: 100,
  },
  {
    id: "subtask-2",
    userId: "user-1",
    taskId: "task-1",
    title: "Build",
    priority: "urgent",
    status: "in_progress",
    estimatedHours: 4,
    realHours: 1,
    progress: 25,
  },
];

export function task(overrides: Partial<Task> = {}): Task {
  return {
    ...baseTask,
    ...overrides,
  };
}

export function subtask(overrides: Partial<Subtask> = {}): Subtask {
  return {
    ...baseSubtasks[0],
    ...overrides,
  };
}

export function block(overrides: Partial<CalendarBlock> = {}): CalendarBlock {
  return {
    id: "block-1",
    userId: "user-1",
    title: "Work block",
    blockType: "simple_task",
    status: "scheduled",
    startAt: "2026-05-24T09:00:00-06:00",
    endAt: "2026-05-24T11:00:00-06:00",
    durationHours: 2,
    realHoursApplied: 0,
    color: "#1f108e",
    ...overrides,
  };
}

export function trashItem(overrides: Partial<TrashItem> = {}): TrashItem {
  return {
    id: "trash-1",
    userId: "user-1",
    entityType: "task",
    entityId: "task-1",
    name: "Deleted task",
    deletedAt: "2026-05-20T00:00:00Z",
    permanentDeleteAt: "2026-05-23T00:00:00Z",
    ...overrides,
  };
}
