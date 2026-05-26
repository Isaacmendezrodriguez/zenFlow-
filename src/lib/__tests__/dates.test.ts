import { describe, expect, it } from "vitest";
import { diffHours, endOfWeekSunday, formatDate, formatTime, isPastDate, isSameDay, isTomorrow, startOfWeekMonday } from "../dates";

describe("date helpers", () => {
  it("detects same day and tomorrow", () => {
    expect(isSameDay("2026-05-24T09:00:00-06:00", "2026-05-24T22:00:00-06:00")).toBe(true);
    expect(isTomorrow("2026-05-25", new Date("2026-05-24T08:00:00-06:00"))).toBe(true);
  });

  it("detects past dates", () => {
    expect(isPastDate("2026-05-23", new Date("2026-05-24T08:00:00-06:00"))).toBe(true);
    expect(isPastDate("2026-05-24", new Date("2026-05-24T08:00:00-06:00"))).toBe(false);
  });

  it("returns Monday start and Sunday end of week", () => {
    expect(startOfWeekMonday("2026-05-24").getDay()).toBe(1);
    expect(endOfWeekSunday("2026-05-24").getDay()).toBe(0);
  });

  it("formats dates and times", () => {
    expect(formatDate("2026-05-24", "yyyy-MM-dd")).toBe("2026-05-24");
    expect(formatTime("2026-05-24T09:30:00-06:00")).toMatch(/\d{2}:\d{2}/);
  });

  it("calculates hour difference", () => {
    expect(diffHours("2026-05-24T09:00:00-06:00", "2026-05-24T11:00:00-06:00")).toBe(2);
  });
});
