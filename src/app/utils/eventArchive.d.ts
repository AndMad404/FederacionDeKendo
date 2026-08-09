import type { CalendarEvent } from "../types";

export function calculateArchiveEligibleAt(
  lastEventDate: string,
  timeZone?: string,
): Date;

export function isArchiveEligible(event: CalendarEvent, now?: Date): boolean;
export function getArchiveEligibleAt(event: CalendarEvent): Date;
