import { create } from "zustand";
import {
  activityLogs as initialActivityLogs,
  calendarBlocks as initialCalendarBlocks,
  notifications as initialNotifications,
  organizations as initialOrganizations,
  projects as initialProjects,
  subtasks as initialSubtasks,
  taskLinks as initialTaskLinks,
  tasks as initialTasks,
  trashItems as initialTrashItems,
  userSettings as initialUserSettings,
} from "../mocks/mock-data";
import type {
  ActivityLog,
  CalendarBlock,
  CalendarBlockType,
  ID,
  LinkType,
  Notification,
  Organization,
  Priority,
  Project,
  Subtask,
  Task,
  TaskLink,
  TaskStatus,
  TaskType,
  TrashItem,
  UserSettings,
} from "../types/domain";
import {
  canArchiveTask,
  canEditTask,
  canPermanentlyDeleteTrashItem,
  canRestoreTrashItem,
  canScheduleBlockForTask,
  completeSubtaskWithRealHours,
  getBlockOverlapWarning,
} from "../lib/business-rules";
import { calculateComplexTaskProgress, calculateEstimatedHoursFromSubtasks, calculateHourDifference, calculateRealHoursFromSubtasks } from "../lib/calculations";
import { addDays } from "date-fns";

const userId = "user-zenflow";

export interface DashboardMetrics {
  projectsWorked: number;
  estimatedHours: number;
  realHours: number;
  completedOnTime: number;
  completedLate: number;
  overdueTasks: number;
  overconsumption: number;
  savedHours: number;
  activitiesCompletedThisWeek: number;
  calendarBlocksCompleted: number;
  backlogLinkedHoursCompleted: number;
  freePersonalHoursCompleted: number;
}

export interface TaskInput {
  title: string;
  description: string;
  type: TaskType;
  organizationId?: ID;
  projectId?: ID;
  dueDate?: string;
  priority?: Priority;
  estimatedHours?: number;
  notes?: string;
  subtasks?: Array<{ title: string; description?: string; estimatedHours: number; priority?: Priority }>;
}

export interface BlockInput {
  title: string;
  description?: string;
  blockType: CalendarBlockType;
  startAt: string;
  endAt: string;
  taskId?: ID;
  subtaskId?: ID;
  organizationId?: ID;
  projectId?: ID;
  color?: string;
}

export interface ZenflowFilters {
  organizationId: ID | "all";
  projectId: ID | "all";
  status: TaskStatus | CalendarBlock["status"] | "all";
  searchQuery: string;
}

interface ZenflowState {
  organizations: Organization[];
  projects: Project[];
  tasks: Task[];
  subtasks: Subtask[];
  taskLinks: TaskLink[];
  calendarBlocks: CalendarBlock[];
  activityLogs: ActivityLog[];
  notifications: Notification[];
  userSettings: UserSettings;
  filters: ZenflowFilters;
  trashItems: TrashItem[];
  activeTimer?: { blockId: ID; isRunning: boolean; elapsedSeconds: number; durationSeconds: number };
  toast?: string;
  hydrateWorkspace: (input: Partial<Pick<ZenflowState, "organizations" | "projects" | "tasks" | "subtasks" | "taskLinks" | "calendarBlocks" | "activityLogs" | "notifications" | "userSettings" | "trashItems">>) => void;
  setToast: (message?: string) => void;
  updateFilters: (input: Partial<ZenflowFilters>) => void;
  resetFilters: () => void;
  createOrganization: (input: Pick<Organization, "name" | "description">) => Organization;
  updateOrganization: (id: ID, input: Partial<Pick<Organization, "name" | "description">>) => void;
  deleteOrganization: (id: ID) => { ok: boolean; message?: string };
  createProject: (input: Pick<Project, "name" | "description" | "organizationId" | "color" | "tags">) => Project;
  updateProject: (id: ID, input: Partial<Pick<Project, "name" | "description" | "color" | "tags">>) => void;
  moveProjectOrganization: (id: ID, organizationId: ID) => void;
  deleteProject: (id: ID) => { ok: boolean; message?: string };
  createTask: (input: TaskInput) => { ok: boolean; task?: Task; message?: string };
  updateTask: (id: ID, input: Partial<Pick<Task, "title" | "description" | "dueDate" | "priority" | "notes" | "organizationId">>) => { ok: boolean; message?: string };
  moveTask: (id: ID, targetStatus: TaskStatus, options?: { forceCompleteSubtasks?: boolean; realHoursBySubtask?: Record<ID, number>; comment?: string }) => { ok: boolean; message?: string };
  archiveTask: (id: ID) => { ok: boolean; message?: string };
  deleteTask: (id: ID) => void;
  completeSubtask: (id: ID, realHours: number) => void;
  updateSubtaskHours: (id: ID, realHours: number, complete?: boolean) => void;
  updateTaskHours: (id: ID, realHours: number, complete?: boolean) => void;
  addTaskLink: (taskId: ID, input: Pick<TaskLink, "title" | "url" | "type" | "description">) => void;
  addTaskNote: (taskId: ID, note: string) => void;
  createCalendarBlock: (input: BlockInput) => { ok: boolean; block?: CalendarBlock; message?: string; warning?: string };
  completeCalendarBlock: (id: ID, realHours?: number) => { ok: boolean; message?: string };
  deleteCalendarBlock: (id: ID) => { ok: boolean; message?: string };
  startTimer: (blockId: ID, durationMinutes?: number) => void;
  toggleTimer: () => void;
  tickTimer: () => void;
  stopTimer: () => void;
  restoreTrashItem: (id: ID) => { ok: boolean; message?: string };
  permanentlyDeleteTrashItem: (id: ID) => void;
  emptyTrash: () => void;
  updateSettings: (input: Partial<UserSettings>) => void;
  getDashboardMetrics: () => DashboardMetrics;
}

export const useZenflowStore = create<ZenflowState>((set, get) => ({
  organizations: initialOrganizations,
  projects: initialProjects,
  tasks: initialTasks,
  subtasks: initialSubtasks,
  taskLinks: initialTaskLinks,
  calendarBlocks: initialCalendarBlocks,
  activityLogs: initialActivityLogs,
  notifications: initialNotifications,
  userSettings: initialUserSettings,
  filters: {
    organizationId: "all",
    projectId: "all",
    status: "all",
    searchQuery: "",
  },
  trashItems: initialTrashItems,
  activeTimer: undefined,
  toast: undefined,

  hydrateWorkspace: (input) => set((state) => ({ ...state, ...input })),

  setToast: (message) => set({ toast: message }),

  updateFilters: (input) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...input,
        ...(input.organizationId && input.organizationId !== state.filters.organizationId ? { projectId: "all" as const } : {}),
      },
    }));
  },

  resetFilters: () => {
    set({
      filters: {
        organizationId: "all",
        projectId: "all",
        status: "all",
        searchQuery: "",
      },
    });
  },

  createOrganization: (input) => {
    const organization: Organization = {
      id: makeId("org"),
      userId,
      name: input.name.trim(),
      description: input.description,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ organizations: [...state.organizations, organization] }));
    return organization;
  },

  updateOrganization: (id, input) => {
    set((state) => ({ organizations: state.organizations.map((organization) => (organization.id === id ? { ...organization, ...input } : organization)) }));
  },

  deleteOrganization: (id) => {
    const state = get();
    const organization = state.organizations.find((item) => item.id === id);
    if (!organization) return { ok: false, message: "Organizacion no encontrada." };
    const orgTasks = state.tasks.filter((task) => task.organizationId === id && !task.deletedAt && !task.isArchived);
    const activeTasks = orgTasks.filter((task) => task.status !== "done");
    if (activeTasks.length) {
      return { ok: false, message: "Esta organizacion tiene tareas activas. Para eliminarla, primero termina, mueve o borra sus tareas." };
    }
    const now = new Date();
    const trashItems = [
      createTrashItem("organization", organization.id, organization.name, organization, now),
      ...orgTasks.map((task) => createTrashItem("task", task.id, task.title, task, now)),
    ];
    set((current) => ({
      organizations: current.organizations.filter((item) => item.id !== id),
      tasks: current.tasks.map((task) => (task.organizationId === id ? { ...task, deletedAt: now.toISOString() } : task)),
      trashItems: [...current.trashItems, ...trashItems],
    }));
    return { ok: true };
  },

  createProject: (input) => {
    const project: Project = {
      id: makeId("project"),
      userId,
      organizationId: input.organizationId,
      name: input.name.trim(),
      description: input.description,
      color: input.color || "#10a37f",
      tags: input.tags ?? [],
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ projects: [...state.projects, project] }));
    return project;
  },

  updateProject: (id, input) => {
    set((state) => ({ projects: state.projects.map((project) => (project.id === id ? { ...project, ...input } : project)) }));
  },

  moveProjectOrganization: (id, organizationId) => {
    set((state) => ({
      projects: state.projects.map((project) => (project.id === id ? { ...project, organizationId } : project)),
      tasks: state.tasks.map((task) => (task.projectId === id ? { ...task, organizationId } : task)),
    }));
  },

  deleteProject: (id) => {
    const state = get();
    const project = state.projects.find((item) => item.id === id);
    if (!project) return { ok: false, message: "Proyecto no encontrado." };
    const projectTasks = state.tasks.filter((task) => task.projectId === id && !task.deletedAt && !task.isArchived);
    if (projectTasks.some((task) => task.status !== "done")) {
      return { ok: false, message: "Este proyecto tiene tareas activas. Terminalas, muevelas o borralas antes de eliminarlo." };
    }
    const now = new Date();
    set((current) => ({
      projects: current.projects.filter((item) => item.id !== id),
      tasks: current.tasks.map((task) => (task.projectId === id ? { ...task, deletedAt: now.toISOString() } : task)),
      trashItems: [...current.trashItems, createTrashItem("project", project.id, project.name, project, now), ...projectTasks.map((task) => createTrashItem("task", task.id, task.title, task, now))],
    }));
    return { ok: true };
  },

  createTask: (input) => {
    const title = input.title.trim();
    const description = input.description.trim();
    if (!title) return { ok: false, message: "El titulo es obligatorio." };
    if (!description) return { ok: false, message: "La descripcion es obligatoria." };
    if (input.type === "complex") {
      if (!input.organizationId || !input.projectId || !input.dueDate) return { ok: false, message: "Una tarea compleja requiere organizacion, proyecto y fecha." };
      if (!input.subtasks?.length) return { ok: false, message: "Una tarea compleja requiere subtareas." };
      if (input.subtasks.some((subtask) => !subtask.title.trim() || subtask.estimatedHours <= 0)) return { ok: false, message: "Cada subtarea necesita titulo y horas estimadas mayores a 0." };
    }
    const id = makeId("task");
    const createdSubtasks: Subtask[] = input.type === "complex" ? (input.subtasks ?? []).map((subtask) => ({
      id: makeId("subtask"),
      userId,
      taskId: id,
      title: subtask.title.trim(),
      description: subtask.description,
      priority: subtask.priority ?? input.priority ?? "medium",
      status: "not_started",
      estimatedHours: subtask.estimatedHours,
      realHours: 0,
      progress: 0,
    })) : [];
    const estimatedHours = input.type === "complex" ? calculateEstimatedHoursFromSubtasks(createdSubtasks) : input.estimatedHours ?? 0;
    const task: Task = {
      id,
      userId,
      organizationId: input.organizationId,
      projectId: input.projectId,
      title,
      description,
      type: input.type,
      status: "not_started",
      priority: input.priority ?? "medium",
      dueDate: input.dueDate,
      estimatedHours,
      realHours: 0,
      progress: 0,
      notes: input.notes,
      tags: [],
      isArchived: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      tasks: [...state.tasks, task],
      subtasks: [...state.subtasks, ...createdSubtasks],
      activityLogs: [...state.activityLogs, createLog(task.id, "card_created", "Card creada")],
    }));
    return { ok: true, task };
  },

  updateTask: (id, input) => {
    const task = get().tasks.find((item) => item.id === id);
    if (!task) return { ok: false, message: "Tarea no encontrada." };
    if (!canEditTask(task)) return { ok: false, message: "Las tareas completadas, archivadas o eliminadas son de solo lectura." };
    set((state) => ({ tasks: state.tasks.map((item) => (item.id === id ? { ...item, ...input } : item)) }));
    return { ok: true };
  },

  moveTask: (id, targetStatus, options = {}) => {
    const state = get();
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return { ok: false, message: "Tarea no encontrada." };
    if (!canEditTask(task)) return { ok: false, message: "Las tareas completadas o archivadas son de solo lectura." };

    if (task.type === "complex" && targetStatus === "done") {
      const taskSubtasks = state.subtasks.filter((subtask) => subtask.taskId === id);
      const pending = taskSubtasks.filter((subtask) => subtask.status !== "done");
      if (pending.length && !options.forceCompleteSubtasks) {
        return { ok: false, message: "Esta tarea compleja tiene subtareas pendientes. Confirma horas reales antes de terminarla." };
      }
      const completedSubtasks = taskSubtasks.map((subtask) => (
        subtask.status === "done" ? subtask : completeSubtaskWithRealHours(subtask, options.realHoursBySubtask?.[subtask.id] ?? subtask.estimatedHours)
      ));
      set((current) => ({
        subtasks: current.subtasks.map((subtask) => completedSubtasks.find((item) => item.id === subtask.id) ?? subtask),
        tasks: current.tasks.map((item) => (item.id === id ? { ...recalculateTaskFromSubtasks({ ...item, status: "done", progress: 100, completedAt: new Date().toISOString() }, completedSubtasks), status: "done", progress: 100, completedAt: new Date().toISOString() } : item)),
        activityLogs: [...current.activityLogs, createLog(id, "card_moved_to_done", options.comment || "Card movida a terminada")],
      }));
      return { ok: true };
    }

    set((current) => ({
      tasks: current.tasks.map((item) => {
        if (item.id !== id) return item;
        let progress = item.progress;
        if (item.type === "simple" && targetStatus === "done") progress = 100;
        if (item.type === "simple" && targetStatus === "in_progress") progress = Math.max(item.progress, 50);
        if (item.type === "simple" && targetStatus === "not_started") progress = 0;
        return { ...item, status: targetStatus, progress, completedAt: targetStatus === "done" ? new Date().toISOString() : item.completedAt };
      }),
      activityLogs: [...current.activityLogs, createLog(id, "card_status_changed", `Card movida a ${targetStatus}`)],
    }));
    return { ok: true };
  },

  archiveTask: (id) => {
    const task = get().tasks.find((item) => item.id === id);
    if (!task) return { ok: false, message: "Tarea no encontrada." };
    if (!canArchiveTask(task)) return { ok: false, message: "Solo las tareas terminadas pueden archivarse." };
    set((state) => ({
      tasks: state.tasks.map((item) => (item.id === id ? { ...item, isArchived: true, archivedAt: new Date().toISOString() } : item)),
      activityLogs: [...state.activityLogs, createLog(id, "card_archived", "Card archivada")],
    }));
    return { ok: true };
  },

  deleteTask: (id) => {
    const task = get().tasks.find((item) => item.id === id);
    if (!task) return;
    const now = new Date();
    set((state) => ({
      tasks: state.tasks.map((item) => (item.id === id ? { ...item, deletedAt: now.toISOString() } : item)),
      trashItems: [...state.trashItems, createTrashItem("task", task.id, task.title, task, now)],
    }));
  },

  completeSubtask: (id, realHours) => {
    const subtask = get().subtasks.find((item) => item.id === id);
    if (!subtask || realHours <= 0) return;
    const completed = completeSubtaskWithRealHours(subtask, realHours);
    set((state) => {
      const nextSubtasks = state.subtasks.map((item) => (item.id === id ? completed : item));
      const parent = state.tasks.find((task) => task.id === subtask.taskId);
      return {
        subtasks: nextSubtasks,
        tasks: parent ? state.tasks.map((task) => (task.id === parent.id ? recalculateTaskFromSubtasks(task, nextSubtasks.filter((item) => item.taskId === parent.id)) : task)) : state.tasks,
        activityLogs: [...state.activityLogs, createLog(subtask.taskId, "subtask_completed", `${subtask.title} completada con ${realHours} horas reales`)],
      };
    });
  },

  updateSubtaskHours: (id, realHours, complete = false) => {
    const subtask = get().subtasks.find((item) => item.id === id);
    if (!subtask || realHours < 0) return;
    set((state) => {
      const nextSubtasks = state.subtasks.map((item) => {
        if (item.id !== id) return item;
        const progress = item.estimatedHours > 0 ? Math.min(Math.round((realHours / item.estimatedHours) * 100), 100) : 0;
        return {
          ...item,
          realHours,
          progress: complete || progress >= 100 ? 100 : progress,
          status: complete || progress >= 100 ? ("done" as const) : realHours > 0 ? ("in_progress" as const) : ("not_started" as const),
          completedAt: complete || progress >= 100 ? new Date().toISOString() : item.completedAt,
        };
      });
      const parent = state.tasks.find((task) => task.id === subtask.taskId);
      return {
        subtasks: nextSubtasks,
        tasks: parent ? state.tasks.map((task) => (task.id === parent.id ? recalculateTaskFromSubtasks(task, nextSubtasks.filter((item) => item.taskId === parent.id)) : task)) : state.tasks,
        activityLogs: [...state.activityLogs, createLog(subtask.taskId, "real_hours_registered", `${subtask.title}: ${realHours} horas reales registradas`)],
      };
    });
  },

  updateTaskHours: (id, realHours, complete = false) => {
    const task = get().tasks.find((item) => item.id === id);
    if (!task || task.type !== "simple" || realHours < 0) return;
    set((state) => ({
      tasks: state.tasks.map((item) => {
        if (item.id !== id) return item;
        const reachedEstimate = item.estimatedHours > 0 && realHours >= item.estimatedHours;
        const done = complete || reachedEstimate;
        return {
          ...item,
          realHours,
          progress: done ? 100 : realHours > 0 ? Math.max(item.progress, 50) : 0,
          status: done ? "done" : realHours > 0 ? "in_progress" : "not_started",
          completedAt: done ? new Date().toISOString() : item.completedAt,
        };
      }),
      activityLogs: [...state.activityLogs, createLog(id, "real_hours_registered", `${realHours} horas reales registradas`)],
    }));
  },

  addTaskLink: (taskId, input) => {
    set((state) => ({
      taskLinks: [...state.taskLinks, { id: makeId("link"), userId, taskId, ...input }],
      activityLogs: [...state.activityLogs, createLog(taskId, "link_added", `Link agregado: ${input.title}`)],
    }));
  },

  addTaskNote: (taskId, note) => {
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, notes: [task.notes, note].filter(Boolean).join("\n\n") } : task)),
      activityLogs: [...state.activityLogs, createLog(taskId, "note_added", "Nota agregada")],
    }));
  },

  createCalendarBlock: (input) => {
    const start = new Date(input.startAt);
    const end = new Date(input.endAt);
    const durationHours = Number(((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1));
    if (durationHours <= 0) return { ok: false, message: "Selecciona una hora final posterior al inicio." };
    if (durationHours > 4) return { ok: false, message: "El bloque no puede durar mas de 4 horas." };
    const linkedTask = input.taskId ? get().tasks.find((task) => task.id === input.taskId) : undefined;
    const schedule = canScheduleBlockForTask({ endAt: input.endAt }, linkedTask);
    if (!schedule.canSchedule) return { ok: false, message: schedule.warning };
    const block: CalendarBlock = {
      id: makeId("block"),
      userId,
      organizationId: input.organizationId ?? linkedTask?.organizationId,
      projectId: input.projectId ?? linkedTask?.projectId,
      taskId: input.taskId,
      subtaskId: input.subtaskId,
      title: input.title.trim(),
      description: input.description,
      blockType: input.blockType,
      status: "scheduled",
      startAt: input.startAt,
      endAt: input.endAt,
      durationHours,
      realHoursApplied: 0,
      color: input.color ?? "#d1fae5",
    };
    const warning = getBlockOverlapWarning(block, get().calendarBlocks);
    set((state) => ({ calendarBlocks: [...state.calendarBlocks, block] }));
    return { ok: true, block, warning };
  },

  completeCalendarBlock: (id, realHours) => {
    const state = get();
    const block = state.calendarBlocks.find((item) => item.id === id);
    if (!block) return { ok: false, message: "Bloque no encontrado." };
    const appliedHours = block.taskId || block.subtaskId ? realHours ?? block.durationHours : 0;
    set((current) => {
      let nextSubtasks = current.subtasks;
      let nextTasks = current.tasks;
      if (block.subtaskId && appliedHours > 0) {
        const subtask = current.subtasks.find((item) => item.id === block.subtaskId);
        if (subtask) {
          nextSubtasks = current.subtasks.map((item) => (item.id === subtask.id ? completeSubtaskWithRealHours({ ...item, realHours: item.realHours + appliedHours }, item.realHours + appliedHours) : item));
          const parent = current.tasks.find((task) => task.id === subtask.taskId);
          if (parent) nextTasks = current.tasks.map((task) => (task.id === parent.id ? recalculateTaskFromSubtasks(task, nextSubtasks.filter((item) => item.taskId === parent.id)) : task));
        }
      } else if (block.taskId && appliedHours > 0) {
        nextTasks = current.tasks.map((task) => {
          if (task.id !== block.taskId) return task;
          if (task.type === "simple") {
            const realHours = task.realHours + appliedHours;
            const reachedEstimate = task.estimatedHours > 0 && realHours >= task.estimatedHours;
            return {
              ...task,
              realHours,
              progress: reachedEstimate ? 100 : Math.max(task.progress, 50),
              status: reachedEstimate ? "done" : task.status === "not_started" ? "in_progress" : task.status,
              completedAt: reachedEstimate ? new Date().toISOString() : task.completedAt,
            };
          }
          return task;
        });
      }
      return {
        calendarBlocks: current.calendarBlocks.map((item) => (item.id === id ? { ...item, status: "completed", completedAt: new Date().toISOString(), realHoursApplied: appliedHours } : item)),
        subtasks: nextSubtasks,
        tasks: nextTasks,
        activityLogs: block.taskId ? [...current.activityLogs, createLog(block.taskId, "real_hours_registered", `Bloque completado, ${appliedHours} horas reales aplicadas`)] : current.activityLogs,
      };
    });
    return { ok: true };
  },

  deleteCalendarBlock: (id) => {
    const block = get().calendarBlocks.find((item) => item.id === id);
    if (!block) return { ok: false, message: "Bloque no encontrado." };
    set((state) => ({
      calendarBlocks: state.calendarBlocks.filter((item) => item.id !== id),
      tasks: block.taskId && block.status === "completed" && block.realHoursApplied > 0
        ? state.tasks.map((task) => (task.id === block.taskId && task.type === "simple" ? { ...task, realHours: Math.max(task.realHours - block.realHoursApplied, 0) } : task))
        : state.tasks,
      activityLogs: block.taskId ? [...state.activityLogs, createLog(block.taskId, "calendar_block_deleted", "Bloque de calendario eliminado")] : state.activityLogs,
    }));
    return { ok: true, message: block.status === "completed" && (block.taskId || block.subtaskId) ? "Las horas reales del bloque completado fueron descontadas si aplicaba." : undefined };
  },

  startTimer: (blockId, durationMinutes = 50) => set({ activeTimer: { blockId, isRunning: true, elapsedSeconds: 0, durationSeconds: Math.max(durationMinutes, 1) * 60 } }),
  toggleTimer: () => set((state) => (state.activeTimer ? { activeTimer: { ...state.activeTimer, isRunning: !state.activeTimer.isRunning } } : state)),
  tickTimer: () => set((state) => {
    if (!state.activeTimer?.isRunning) return state;
    const nextElapsed = Math.min(state.activeTimer.elapsedSeconds + 1, state.activeTimer.durationSeconds);
    return { activeTimer: { ...state.activeTimer, elapsedSeconds: nextElapsed, isRunning: nextElapsed < state.activeTimer.durationSeconds } };
  }),
  stopTimer: () => set({ activeTimer: undefined }),

  restoreTrashItem: (id) => {
    const item = get().trashItems.find((trashItem) => trashItem.id === id);
    if (!item) return { ok: false, message: "Elemento no encontrado." };
    if (!canRestoreTrashItem(item)) return { ok: false, message: "Este elemento ya expiro y no se puede restaurar." };
    set((state) => ({
      tasks: item.entityType === "task" ? state.tasks.map((task) => (task.id === item.entityId ? { ...task, deletedAt: undefined } : task)) : state.tasks,
      trashItems: state.trashItems.filter((trashItem) => trashItem.id !== id),
    }));
    return { ok: true };
  },

  permanentlyDeleteTrashItem: (id) => {
    set((state) => ({ trashItems: state.trashItems.filter((item) => item.id !== id) }));
  },

  emptyTrash: () => set({ trashItems: [] }),

  updateSettings: (input) => set((state) => ({ userSettings: { ...state.userSettings, ...input } })),

  getDashboardMetrics: () => {
    const state = get();
    const activeTasks = state.tasks.filter((task) => !task.deletedAt && !task.isArchived);
    const completedTasks = activeTasks.filter((task) => task.status === "done");
    const estimatedHours = activeTasks.reduce((total, task) => total + task.estimatedHours, 0);
    const realHours = activeTasks.reduce((total, task) => total + task.realHours, 0);
    const completedBlocks = state.calendarBlocks.filter((block) => block.status === "completed" && !block.deletedAt);
    const linkedBlocks = completedBlocks.filter((block) => block.taskId || block.subtaskId);
    const freeBlocks = completedBlocks.filter((block) => !block.taskId && !block.subtaskId);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    return {
      projectsWorked: new Set(activeTasks.filter((task) => task.realHours > 0).map((task) => task.projectId).filter(Boolean)).size,
      estimatedHours,
      realHours,
      completedOnTime: completedTasks.filter((task) => task.completedAt && task.dueDate && new Date(task.completedAt) <= new Date(`${task.dueDate}T23:59:59`)).length,
      completedLate: completedTasks.filter((task) => task.completedAt && task.dueDate && new Date(task.completedAt) > new Date(`${task.dueDate}T23:59:59`)).length,
      overdueTasks: activeTasks.filter((task) => task.status !== "done" && task.dueDate && new Date(task.dueDate) < new Date()).length,
      overconsumption: activeTasks.reduce((total, task) => total + Math.max(calculateHourDifference(task.estimatedHours, task.realHours), 0), 0),
      savedHours: activeTasks.reduce((total, task) => total + Math.max(calculateHourDifference(task.estimatedHours, task.realHours) * -1, 0), 0),
      activitiesCompletedThisWeek: state.activityLogs.filter((log) => new Date(log.createdAt) >= weekStart).length,
      calendarBlocksCompleted: completedBlocks.length,
      backlogLinkedHoursCompleted: linkedBlocks.reduce((total, block) => total + block.realHoursApplied, 0),
      freePersonalHoursCompleted: freeBlocks.reduce((total, block) => total + block.durationHours, 0),
    };
  },
}));

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createLog(taskId: ID, eventType: string, message: string): ActivityLog {
  return { id: makeId("activity"), userId, taskId, eventType, message, createdAt: new Date().toISOString() };
}

function createTrashItem(entityType: TrashItem["entityType"], entityId: ID, name: string, entitySnapshot: TrashItem["entitySnapshot"], now: Date): TrashItem {
  return {
    id: makeId("trash"),
    userId,
    entityType,
    entityId,
    name,
    deletedAt: now.toISOString(),
    permanentDeleteAt: addDays(now, 3).toISOString(),
    entitySnapshot,
  };
}

function recalculateTaskFromSubtasks(task: Task, taskSubtasks: Subtask[]): Task {
  if (task.type !== "complex") return task;
  const estimatedHours = calculateEstimatedHoursFromSubtasks(taskSubtasks);
  const realHours = calculateRealHoursFromSubtasks(taskSubtasks);
  const progress = calculateComplexTaskProgress(taskSubtasks);
  return {
    ...task,
    estimatedHours,
    realHours,
    progress,
    status: progress >= 100 ? "done" : progress > 0 && task.status === "not_started" ? "in_progress" : task.status,
    completedAt: progress >= 100 ? task.completedAt ?? new Date().toISOString() : task.completedAt,
  };
}
