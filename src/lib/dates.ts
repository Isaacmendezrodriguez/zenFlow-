import {
  addDays,
  differenceInCalendarDays,
  differenceInMinutes,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay as dateFnsIsSameDay,
  parseISO,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

type DateInput = string | Date;

function toDate(date: DateInput): Date {
  return typeof date === "string" ? parseISO(date) : date;
}

export function isSameDay(dateA: DateInput, dateB: DateInput): boolean {
  return dateFnsIsSameDay(toDate(dateA), toDate(dateB));
}

export function isTomorrow(date: DateInput, now: DateInput = new Date()): boolean {
  return differenceInCalendarDays(toDate(date), toDate(now)) === 1;
}

export function isPastDate(date: DateInput, now: DateInput = new Date()): boolean {
  return isBefore(toDate(date), startOfDayLocal(toDate(now))) || (isBefore(toDate(date), toDate(now)) && !isSameDay(date, now));
}

export function startOfWeekMonday(date: DateInput): Date {
  return startOfWeek(toDate(date), { weekStartsOn: 1 });
}

export function endOfWeekSunday(date: DateInput): Date {
  return endOfWeek(toDate(date), { weekStartsOn: 1 });
}

export function formatDate(date: DateInput, pattern = "dd MMM yyyy"): string {
  return format(toDate(date), pattern, { locale: es });
}

export function formatTime(date: DateInput): string {
  return format(toDate(date), "HH:mm", { locale: es });
}

export function diffHours(startAt: DateInput, endAt: DateInput): number {
  const minutes = differenceInMinutes(toDate(endAt), toDate(startAt));
  if (minutes <= 0) return 0;
  return Number((minutes / 60).toFixed(1));
}

export function formatShortDate(date: string): string {
  return formatDate(date, "dd MMM");
}

export function formatDateTime(date: string): string {
  return formatDate(date, "dd MMM, HH:mm");
}

export function getDueLabel(dueDate?: string): string {
  if (!dueDate) return "Sin fecha";
  const days = differenceInCalendarDays(parseISO(dueDate), new Date());
  if (days < 0) return `Vencida hace ${Math.abs(days)} dia(s)`;
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence manana";
  return `Vence en ${days} dias`;
}

export function isOverdue(dueDate?: string): boolean {
  return Boolean(dueDate && isAfter(new Date(), parseISO(`${dueDate}T23:59:59`)));
}

export function getCurrentWeekDays(): Date[] {
  const monday = startOfWeekMonday(new Date());
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

function startOfDayLocal(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
