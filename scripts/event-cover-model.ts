import type { CalendarEvent } from "../src/app/types";

export type CoverEvent = { id: string; title: string; tag: string };

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

/** The calendar owns event identity and classification; no second event store. */
export function adaptCoverEvent(
  event: Pick<CalendarEvent, "id" | "title" | "eventType" | "type">,
): CoverEvent {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(event.id))
    throw new Error(`Unsafe event id: ${event.id}`);
  const title = event.title.normalize("NFC").replace(/\s+/gu, " ").trim();
  if (!title) throw new Error(`Empty cover title: ${event.id}`);
  const type = (event.eventType ?? event.type ?? "evento")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  const tags: Record<string, string> = {
    torneo: "#Torneo",
    seminario: "#Seminario",
    examen: "#Examen",
    evento: "#Evento",
    "entrenamiento especial": "#Seminario",
  };
  return { id: event.id, title, tag: tags[type] ?? "#Evento" };
}

/** Sharp/Pango parses markup, so even plain event titles must be escaped. */
export function escapeCoverText(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]!,
  );
}
