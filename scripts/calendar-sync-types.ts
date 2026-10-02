import type { CalendarEvent } from "../src/app/types";
import type { EventGallery } from "../src/app/data/eventGalleries";

export type PublicFields = Omit<CalendarEvent, "id"> & {
  slug: string;
  sourceId: string;
};
export type RevisionReason =
  "future_missing" | "historical_missing" | "historical_change";
export interface Evidence {
  sourceId: string;
  firstDetectedAt: string;
  lastObservedAt: string;
  missingAt: string | null;
  lastReceived: Record<string, unknown> | null;
  published: Record<string, unknown> | null;
  fingerprint: string;
}
export interface PendingRevision {
  id: string;
  reason: RevisionReason;
  proposed: Record<string, unknown> | null;
  evidence: Evidence;
  notification?: { evidenceFingerprint: string };
}
export interface Decision {
  sourceId: string;
  revisionId: string;
  evidenceFingerprint?: string;
  action: string;
  decidedAt?: string;
  decisionRecordId?: string;
  reason?: string;
  actorRole?: string;
}
export interface RegistryEvent extends PublicFields {
  historical?: boolean;
  inactive?: boolean;
  editorialState?: string;
  pendingRevision?: PendingRevision;
  editorialDecision?: Omit<Decision, "sourceId">;
}
export interface Registry {
  version: number;
  events: RegistryEvent[];
}
export interface IcsProperty {
  name: string;
  params: Record<string, string>;
  rawValue: string;
  value: string;
}
export interface Difference {
  field: string;
  published: unknown;
  proposed: unknown;
  type: string;
}
export interface HistoricalChange {
  sourceId: string;
  publicIdentity: { slug: string; title: unknown; date: string };
  differences: Difference[];
  publishedFingerprint: string;
  proposalFingerprint: string;
  revisionId?: string;
  evidenceFingerprint?: string;
}
export interface GalleryAlarm {
  slug: string;
  status: string;
  reason: string;
}
export interface HistoricalReport {
  version: number;
  historicalChanges: HistoricalChange[];
  galleryChanges?: GalleryAlarm[];
}
export interface Execution {
  origin: string;
  runId: string | null;
  attempt: string | null;
  trigger: string | null;
}
export interface Notification {
  id: string;
  kind: string;
  identity: Record<string, unknown> | null;
  temporality: string;
  cause: string;
  actionRequired: string;
  before: unknown;
  after: unknown;
  execution: Execution;
  fingerprints: Record<string, string | null>;
}
export interface NotificationReport {
  version: number;
  notifications: Notification[];
}
export interface CalendarError extends Error {
  code?: string;
  calendarNotification?: {
    kind: string;
    identity: Record<string, unknown>;
    before: unknown;
    after: unknown;
  };
}
export interface Publication {
  target: string;
  staged: string;
}
export interface DriveFile {
  id: string;
  name: string;
}
export interface GalleryEvent {
  slug: string;
  title: string;
  date: string;
  albumUrl?: string;
  galleryCheckPhase?: string;
}
export interface GalleryState {
  version: number;
  galleries: Record<string, { fingerprint: string }>;
  checks: Record<string, { phase: string }>;
}
export interface GalleryOptions {
  events?: GalleryEvent[];
  manifestPath?: string;
  statePath?: string;
  imagesRoot?: string;
  listFolder?: (url: string) => Promise<DriveFile[]>;
  downloadFile?: (file: DriveFile) => Promise<Buffer>;
  deferPublish?: boolean;
  force?: boolean;
}
export interface GalleryResult {
  galleries: Record<string, EventGallery>;
  state: GalleryState;
  warnings: string[];
  alarms: GalleryAlarm[];
  publication?: Publication[];
  importedCount: number;
}
export interface SyncOptions {
  source?: string;
  outputPath?: string;
  registryPath?: string;
  now?: Date;
  galleryOptions?: GalleryOptions;
}
export interface Correction {
  sourceId: string;
  publishedFingerprint: string;
  proposalFingerprint: string;
  fields: string[];
}
export interface CorrectionOptions {
  registryPath: string;
  outputPath: string;
  reportPath: string;
  corrections: Correction[];
}
