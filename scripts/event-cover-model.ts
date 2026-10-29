import type { CalendarEvent } from "../src/app/types";

export type CoverEvent = Pick<CalendarEvent, "id">;

export function assertCoverGenerationReady(approval: {
  status: string;
  formats?: Record<string, string>;
}) {
  if (
    approval.status !== "approved" ||
    (approval.formats &&
      !Object.values(approval.formats).some((status) => status === "approved"))
  ) {
    throw new Error(
      "Event covers are paused: awaiting generation authorization and format composition approval. No images were generated.",
    );
  }
}

/** Only identity is needed to associate shared, text-free artwork with events. */
export function adaptCoverEvent(event: CoverEvent): CoverEvent {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(event.id))
    throw new Error(`Unsafe event id: ${event.id}`);
  return { id: event.id };
}
