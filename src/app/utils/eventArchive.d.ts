import type { CalendarEvent } from "../types";
import type { Language } from "../config/i18n";

export type ArchiveEventType = "torneo" | "examen" | "seminario" | "evento";
export interface ArchiveFilters {
  year?: string;
  type?: ArchiveEventType;
}

export function calculateArchiveEligibleAt(
  lastEventDate: string,
  timeZone?: string,
): Date;

export function isArchiveEligible(event: CalendarEvent, now?: Date): boolean;
export function getArchiveEligibleAt(event: CalendarEvent): Date;
export function calculateGalleryCheckAt(
  lastEventDate: string,
  timeZone?: string,
): Date;
export function normalizeArchiveFilters(filters: Record<string, string | undefined>): ArchiveFilters;
export function filterAndSortArchiveEvents(events: CalendarEvent[], filters: ArchiveFilters | Record<string, string | undefined>): CalendarEvent[];
export function getArchiveYears(events: CalendarEvent[]): string[];
export function buildArchiveUrl(page: number, language?: Language, filters?: ArchiveFilters): string;
