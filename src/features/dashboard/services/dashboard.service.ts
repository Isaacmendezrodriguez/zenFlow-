import { listCalendarBlocks } from "../../calendar/services/calendar.service";
import { listTasks } from "../../tasks/services/tasks.service";
import { failure, success, type ServiceResult } from "../../../lib/service-result";

export async function getDashboardData(): Promise<ServiceResult<{ tasks: unknown[]; calendarBlocks: unknown[] }>> {
  const tasks = await listTasks();
  if (tasks.error) return failure(tasks.error);

  const calendarBlocks = await listCalendarBlocks();
  if (calendarBlocks.error) return failure(calendarBlocks.error);

  return success({ tasks: tasks.data ?? [], calendarBlocks: calendarBlocks.data ?? [] });
}
