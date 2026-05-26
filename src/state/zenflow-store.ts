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
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";
import { loadOrSeedWorkspace } from "../features/workspace/workspace-sync.service";
import type { Json } from "../types/database";

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
  activeTimer?: { blockId?: ID; isRunning: boolean; elapsedSeconds: number; durationSeconds: number };
  toast?: string;
  hydrateWorkspace: (input: Partial<Pick<ZenflowState, "organizations" | "projects" | "tasks" | "subtasks" | "taskLinks" | "calendarBlocks" | "activityLogs" | "notifications" | "userSettings" | "trashItems">>) => void;
  syncWorkspace: () => Promise<void>;
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
  startTimer: (blockId?: ID, durationMinutes?: number) => void;
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
  organizations: isSupabaseConfigured ? [] : initialOrganizations,
  projects: isSupabaseConfigured ? [] : initialProjects,
  tasks: isSupabaseConfigured ? [] : initialTasks,
  subtasks: isSupabaseConfigured ? [] : initialSubtasks,
  taskLinks: isSupabaseConfigured ? [] : initialTaskLinks,
  calendarBlocks: isSupabaseConfigured ? [] : initialCalendarBlocks,
  activityLogs: isSupabaseConfigured ? [] : initialActivityLogs,
  notifications: isSupabaseConfigured ? [] : initialNotifications,
  userSettings: initialUserSettings,
  filters: {
    organizationId: "all",
    projectId: "all",
    status: "all",
    searchQuery: "",
  },
  trashItems: isSupabaseConfigured ? [] : initialTrashItems,
  activeTimer: undefined,
  toast: undefined,

  hydrateWorkspace: (input) => set((state) => ({ ...state, ...input })),

  syncWorkspace: async () => {
    if (!isSupabaseConfigured) return;
    await remoteSyncQueue;
    await refreshRemoteWorkspace();
  },

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
    persistTaskCreate(task, createdSubtasks);
    return { ok: true, task };
  },

  updateTask: (id, input) => {
    const task = get().tasks.find((item) => item.id === id);
    if (!task) return { ok: false, message: "Tarea no encontrada." };
    if (!canEditTask(task)) return { ok: false, message: "Las tareas completadas, archivadas o eliminadas son de solo lectura." };
    set((state) => ({ tasks: state.tasks.map((item) => (item.id === id ? { ...item, ...input } : item)) }));
    persistTaskUpdate(id, input);
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
      persistComplexTaskDone(id, completedSubtasks, options.comment);
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
    persistTaskMove(id);
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
    persistTaskArchive(id);
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
    persistTaskDelete(task, now);
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
    persistSubtaskHours(id, realHours, true);
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
    persistSubtaskHours(id, realHours, complete);
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
    persistTaskHours(id, realHours, complete);
  },

  addTaskLink: (taskId, input) => {
    set((state) => ({
      taskLinks: [...state.taskLinks, { id: makeId("link"), userId, taskId, ...input }],
      activityLogs: [...state.activityLogs, createLog(taskId, "link_added", `Link agregado: ${input.title}`)],
    }));
    persistTaskLink(taskId, input);
  },

  addTaskNote: (taskId, note) => {
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, notes: [task.notes, note].filter(Boolean).join("\n\n") } : task)),
      activityLogs: [...state.activityLogs, createLog(taskId, "note_added", "Nota agregada")],
    }));
    persistTaskNote(taskId, get().tasks.find((task) => task.id === taskId)?.notes ?? note);
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
    set((state) => ({
      calendarBlocks: [...state.calendarBlocks, block],
      tasks: block.taskId
        ? state.tasks.map((task) => (task.id === block.taskId && task.status === "not_started" ? { ...task, status: "in_progress", progress: Math.max(task.progress, task.type === "simple" ? 50 : task.progress) } : task))
        : state.tasks,
    }));
    persistCalendarBlock(block);
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
        const linkedTask = current.tasks.find((task) => task.id === block.taskId);
        if (linkedTask?.type === "complex") {
          const taskSubtasks = current.subtasks.filter((item) => item.taskId === linkedTask.id);
          const targetSubtask = taskSubtasks.find((item) => item.status !== "done") ?? taskSubtasks[0];
          if (targetSubtask) {
            nextSubtasks = current.subtasks.map((item) => {
              if (item.id !== targetSubtask.id) return item;
              const nextHours = item.realHours + appliedHours;
              const progress = item.estimatedHours > 0 ? Math.min(Math.round((nextHours / item.estimatedHours) * 100), 100) : 0;
              return {
                ...item,
                realHours: nextHours,
                progress,
                status: progress >= 100 ? "done" : "in_progress",
                completedAt: progress >= 100 ? new Date().toISOString() : item.completedAt,
              };
            });
            nextTasks = current.tasks.map((task) => (task.id === linkedTask.id ? recalculateTaskFromSubtasks({ ...task, status: task.status === "not_started" ? "in_progress" : task.status }, nextSubtasks.filter((item) => item.taskId === linkedTask.id)) : task));
          }
        } else {
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
      }
      return {
        calendarBlocks: current.calendarBlocks.map((item) => (item.id === id ? { ...item, status: "completed", completedAt: new Date().toISOString(), realHoursApplied: appliedHours } : item)),
        subtasks: nextSubtasks,
        tasks: nextTasks,
        activityLogs: block.taskId ? [...current.activityLogs, createLog(block.taskId, "real_hours_registered", `Bloque completado, ${appliedHours} horas reales aplicadas`)] : current.activityLogs,
      };
    });
    persistCalendarBlockComplete(id, appliedHours);
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
    persistCalendarBlockDelete(block);
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
    persistTrashRestore(item);
    return { ok: true };
  },

  permanentlyDeleteTrashItem: (id) => {
    set((state) => ({ trashItems: state.trashItems.filter((item) => item.id !== id) }));
    persistTrashPermanentDelete(id);
  },

  emptyTrash: () => {
    set({ trashItems: [] });
    persistTrashEmpty();
  },

  updateSettings: (input) => set((state) => {
    const userSettings = { ...state.userSettings, ...input };
    persistSettings(userSettings);
    return { userSettings };
  }),

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
  if (isSupabaseConfigured && typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function runRemoteSync(task: () => Promise<void>) {
  if (!isSupabaseConfigured) return;
  remoteSyncQueue = remoteSyncQueue.then(task).catch((error) => {
    console.error("No se pudo sincronizar con Supabase.", error);
    useZenflowStore.setState({ toast: "No se pudo guardar en Supabase. Revisa tu conexion." });
  });
}

let remoteSyncQueue = Promise.resolve();

async function refreshRemoteWorkspace() {
  const snapshot = await loadOrSeedWorkspace();
  if (snapshot) useZenflowStore.setState(snapshot);
}

async function getRemoteUserId() {
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Usuario no autenticado.");
  return data.user.id;
}

function persistTaskCreate(task: Task, subtasks: Subtask[]) {
  runRemoteSync(async () => {
    const userId = await getRemoteUserId();
    const client = getSupabaseClient();
    const { error } = await client.from("tasks").insert({
      id: task.id,
      user_id: userId,
      organization_id: task.organizationId ?? null,
      project_id: task.projectId ?? null,
      title: task.title,
      description: task.description,
      type: task.type,
      status: task.status,
      priority: task.priority,
      due_date: task.dueDate ?? null,
      estimated_hours: task.estimatedHours,
      real_hours: task.realHours,
      progress: task.progress,
      notes: task.notes ?? null,
    });
    if (error) throw error;
    if (subtasks.length) {
      const { error: subtaskError } = await client.from("subtasks").insert(subtasks.map((subtask) => ({
        id: subtask.id,
        user_id: userId,
        task_id: task.id,
        title: subtask.title,
        description: subtask.description ?? null,
        priority: subtask.priority,
        status: subtask.status,
        estimated_hours: subtask.estimatedHours,
        real_hours: subtask.realHours,
        progress: subtask.progress,
      })));
      if (subtaskError) throw subtaskError;
    }
    await persistActivityLog(task.id, "card_created", "Card creada");
    await refreshRemoteWorkspace();
  });
}

function persistTaskUpdate(id: ID, input: Partial<Task>) {
  runRemoteSync(async () => {
    const update = mapTaskUpdate(input);
    if (!Object.keys(update).length) return;
    const { error } = await getSupabaseClient().from("tasks").update(update).eq("id", id);
    if (error) throw error;
    await refreshRemoteWorkspace();
  });
}

function persistTaskMove(id: ID) {
  const task = useZenflowStore.getState().tasks.find((item) => item.id === id);
  if (!task) return;
  persistTaskUpdate(id, task);
}

function persistComplexTaskDone(id: ID, subtasks: Subtask[], comment?: string) {
  runRemoteSync(async () => {
    const task = useZenflowStore.getState().tasks.find((item) => item.id === id);
    if (!task) return;
    const client = getSupabaseClient();
    const { error: taskError } = await client.from("tasks").update(mapTaskUpdate(task)).eq("id", id);
    if (taskError) throw taskError;
    for (const subtask of subtasks) {
      const { error } = await client.from("subtasks").update(mapSubtaskUpdate(subtask)).eq("id", subtask.id);
      if (error) throw error;
    }
    if (comment) await persistActivityLog(id, "card_moved_to_done", comment);
    await refreshRemoteWorkspace();
  });
}

function persistTaskArchive(id: ID) {
  runRemoteSync(async () => {
    const { error } = await getSupabaseClient().from("tasks").update({ is_archived: true, archived_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    await refreshRemoteWorkspace();
  });
}

function persistTaskDelete(task: Task, now: Date) {
  runRemoteSync(async () => {
    const userId = await getRemoteUserId();
    const client = getSupabaseClient();
    const deletedAt = now.toISOString();
    const { error: taskError } = await client.from("tasks").update({ deleted_at: deletedAt }).eq("id", task.id);
    if (taskError) throw taskError;
    const { error: trashError } = await client.from("trash_items").insert({
      user_id: userId,
      entity_type: "task",
      entity_id: task.id,
      name: task.title,
      entity_snapshot: task as unknown as Json,
      deleted_at: deletedAt,
      permanent_delete_at: addDays(now, 3).toISOString(),
    });
    if (trashError) throw trashError;
    await refreshRemoteWorkspace();
  });
}

function persistSubtaskHours(id: ID, realHours: number, complete = false) {
  runRemoteSync(async () => {
    const subtask = useZenflowStore.getState().subtasks.find((item) => item.id === id);
    if (!subtask) return;
    const client = getSupabaseClient();
    const { error } = await client.from("subtasks").update(mapSubtaskUpdate(subtask)).eq("id", id);
    if (error) throw error;
    const parent = useZenflowStore.getState().tasks.find((task) => task.id === subtask.taskId);
    if (parent) {
      const { error: taskError } = await client.from("tasks").update(mapTaskUpdate(parent)).eq("id", parent.id);
      if (taskError) throw taskError;
    }
    await persistActivityLog(subtask.taskId, complete ? "subtask_completed" : "real_hours_registered", `${subtask.title}: ${realHours} horas reales`);
    await refreshRemoteWorkspace();
  });
}

function persistTaskHours(id: ID, realHours: number, complete = false) {
  runRemoteSync(async () => {
    const task = useZenflowStore.getState().tasks.find((item) => item.id === id);
    if (!task) return;
    const { error } = await getSupabaseClient().from("tasks").update(mapTaskUpdate(task)).eq("id", id);
    if (error) throw error;
    await persistActivityLog(id, complete ? "card_completed" : "real_hours_registered", `${realHours} horas reales`);
    await refreshRemoteWorkspace();
  });
}

function persistTaskLink(taskId: ID, input: Pick<TaskLink, "title" | "url" | "type" | "description">) {
  runRemoteSync(async () => {
    const userId = await getRemoteUserId();
    const { error } = await getSupabaseClient().from("task_links").insert({
      user_id: userId,
      task_id: taskId,
      title: input.title,
      url: input.url,
      type: input.type,
      description: input.description ?? null,
    });
    if (error) throw error;
    await refreshRemoteWorkspace();
  });
}

function persistTaskNote(taskId: ID, notes: string) {
  runRemoteSync(async () => {
    const { error } = await getSupabaseClient().from("tasks").update({ notes }).eq("id", taskId);
    if (error) throw error;
    await persistActivityLog(taskId, "note_added", "Nota agregada");
    await refreshRemoteWorkspace();
  });
}

function persistCalendarBlock(block: CalendarBlock) {
  runRemoteSync(async () => {
    const userId = await getRemoteUserId();
    const { error } = await getSupabaseClient().from("calendar_blocks").insert({
      user_id: userId,
      organization_id: block.organizationId ?? null,
      project_id: block.projectId ?? null,
      task_id: block.taskId ?? null,
      subtask_id: block.subtaskId ?? null,
      title: block.title,
      description: block.description ?? null,
      block_type: block.blockType,
      status: block.status,
      start_at: block.startAt,
      end_at: block.endAt,
      duration_hours: block.durationHours,
      real_hours_applied: block.realHoursApplied,
      affects_backlog: Boolean(block.taskId || block.subtaskId),
      color: block.color,
    });
    if (error) throw error;
    if (block.taskId) {
      const task = useZenflowStore.getState().tasks.find((item) => item.id === block.taskId);
      if (task) {
        const { error: taskError } = await getSupabaseClient().from("tasks").update(mapTaskUpdate(task)).eq("id", task.id);
        if (taskError) throw taskError;
      }
    }
    await refreshRemoteWorkspace();
  });
}

function persistCalendarBlockComplete(id: ID, realHours: number) {
  runRemoteSync(async () => {
    const block = useZenflowStore.getState().calendarBlocks.find((item) => item.id === id);
    const client = getSupabaseClient();
    const { error } = await client.from("calendar_blocks").update({ status: "completed", completed_at: block?.completedAt ?? new Date().toISOString(), real_hours_applied: realHours }).eq("id", id);
    if (error) throw error;
    const task = block?.taskId ? useZenflowStore.getState().tasks.find((item) => item.id === block.taskId) : undefined;
    if (task) {
      const { error: taskError } = await client.from("tasks").update(mapTaskUpdate(task)).eq("id", task.id);
      if (taskError) throw taskError;
    }
    const subtask = block?.subtaskId ? useZenflowStore.getState().subtasks.find((item) => item.id === block.subtaskId) : undefined;
    if (subtask) {
      const { error: subtaskError } = await client.from("subtasks").update(mapSubtaskUpdate(subtask)).eq("id", subtask.id);
      if (subtaskError) throw subtaskError;
    }
    if (block?.taskId) {
      const changedSubtasks = useZenflowStore.getState().subtasks.filter((item) => item.taskId === block.taskId);
      for (const item of changedSubtasks) {
        const { error: subtaskError } = await client.from("subtasks").update(mapSubtaskUpdate(item)).eq("id", item.id);
        if (subtaskError) throw subtaskError;
      }
    }
    await refreshRemoteWorkspace();
  });
}

function persistCalendarBlockDelete(block: CalendarBlock) {
  runRemoteSync(async () => {
    const client = getSupabaseClient();
    const { error } = await client.from("calendar_blocks").update({ deleted_at: new Date().toISOString() }).eq("id", block.id);
    if (error) throw error;
    if (block.taskId) {
      const task = useZenflowStore.getState().tasks.find((item) => item.id === block.taskId);
      if (task) {
        const { error: taskError } = await client.from("tasks").update(mapTaskUpdate(task)).eq("id", task.id);
        if (taskError) throw taskError;
      }
    }
    await refreshRemoteWorkspace();
  });
}

function persistTrashRestore(item: TrashItem) {
  runRemoteSync(async () => {
    const client = getSupabaseClient();
    if (item.entityType === "task") {
      const { error } = await client.from("tasks").update({ deleted_at: null }).eq("id", item.entityId);
      if (error) throw error;
    }
    if (item.entityType === "organization") {
      const { error } = await client.from("organizations").update({ deleted_at: null }).eq("id", item.entityId);
      if (error) throw error;
    }
    if (item.entityType === "project") {
      const { error } = await client.from("projects").update({ deleted_at: null }).eq("id", item.entityId);
      if (error) throw error;
    }
    const { error: trashError } = await client.from("trash_items").delete().eq("id", item.id);
    if (trashError) throw trashError;
    await refreshRemoteWorkspace();
  });
}

function persistTrashPermanentDelete(id: ID) {
  runRemoteSync(async () => {
    const { error } = await getSupabaseClient().from("trash_items").delete().eq("id", id);
    if (error) throw error;
    await refreshRemoteWorkspace();
  });
}

function persistTrashEmpty() {
  runRemoteSync(async () => {
    const userId = await getRemoteUserId();
    const { error } = await getSupabaseClient().from("trash_items").delete().eq("user_id", userId);
    if (error) throw error;
    await refreshRemoteWorkspace();
  });
}

function persistSettings(settings: UserSettings) {
  runRemoteSync(async () => {
    const userId = await getRemoteUserId();
    const { error } = await getSupabaseClient().from("user_settings").upsert({
      user_id: userId,
      theme: settings.theme,
      primary_color: settings.primaryColor,
      secondary_color: settings.secondaryColor,
      priority_colors: settings.priorityColors,
      enable_review_column: settings.enableReviewColumn,
      enable_blocked_column: settings.enableBlockedColumn,
      enable_waiting_column: settings.enableWaitingColumn,
      enable_internal_notifications: settings.enableInternalNotifications,
      notify_before_block_minutes: settings.notifyBeforeBlockMinutes,
      daily_summary: settings.dailySummary,
      timer_break_minutes: settings.timerBreakMinutes,
      backlog_view: settings.backlogView,
    }, { onConflict: "user_id" });
    if (error) throw error;
  });
}

async function persistActivityLog(taskId: ID, eventType: string, message: string) {
  const userId = await getRemoteUserId();
  const { error } = await getSupabaseClient().from("activity_logs").insert({ user_id: userId, task_id: taskId, event_type: eventType, message });
  if (error) throw error;
}

function mapTaskUpdate(input: Partial<Task>) {
  return withoutUndefined({
    organization_id: input.organizationId,
    title: input.title,
    description: input.description,
    status: input.status,
    priority: input.priority,
    due_date: input.dueDate,
    estimated_hours: input.estimatedHours,
    real_hours: input.realHours,
    progress: input.progress,
    notes: input.notes,
    is_archived: input.isArchived,
    archived_at: input.archivedAt,
    completed_at: input.completedAt,
    deleted_at: input.deletedAt,
  });
}

function mapSubtaskUpdate(input: Partial<Subtask>) {
  return withoutUndefined({
    title: input.title,
    description: input.description,
    priority: input.priority,
    status: input.status,
    estimated_hours: input.estimatedHours,
    real_hours: input.realHours,
    progress: input.progress,
    completed_at: input.completedAt,
  });
}

function withoutUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<T>;
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
