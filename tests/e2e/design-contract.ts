export const APPROVED_VIEWPORTS = [
  { name: "mobile-360x800", width: 360, height: 800 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "desktop-1366x768", width: 1366, height: 768 },
] as const;

export type PageDesign =
  | "home"
  | "calendar"
  | "gallery"
  | "affiliates"
  | "event"
  | "pastEvents"
  | "notFound";

export interface ApprovedPage {
  name: string;
  path: string;
  design: PageDesign;
}

export const FIXED_TEST_TIME = new Date("2026-08-04T12:00:00-06:00");

export const PREFERRED_REPRESENTATIVE_PATHS: Partial<Record<PageDesign, string>> = {
  event: "/eventos/2026-08-08-examen/",
};

export const SHELL_CONTRACT = {
  mainPaddingInline: 10,
  routeSurfaceMarginBlock: 8,
  routeSurfaceRadius: 14,
  desktopViewport: { width: 1366, height: 768 },
} as const;

interface ComponentSpacingContract {
  selector: string;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  rowGap?: number;
  columnGap?: number;
}

const SHARED_SPACING: Partial<Record<PageDesign, ComponentSpacingContract>> = {
  gallery: {
    selector: "main figure figcaption > div",
    paddingTop: 10,
    paddingRight: 10,
    paddingBottom: 10,
    paddingLeft: 10,
  },
  event: {
    selector: "main > section article",
    paddingTop: 12,
    paddingRight: 20,
    paddingBottom: 12,
    paddingLeft: 20,
    rowGap: 12,
    columnGap: 12,
  },
  pastEvents: {
    selector: "main > section > div:last-child > div",
    paddingTop: 16,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    rowGap: 12,
    columnGap: 12,
  },
  notFound: {
    selector: "main > section",
    paddingTop: 48,
    paddingRight: 16,
    paddingBottom: 48,
    paddingLeft: 16,
    rowGap: 24,
    columnGap: 24,
  },
};

export function getComponentSpacingContract(
  design: PageDesign,
  viewportWidth: number,
): ComponentSpacingContract | undefined {
  if (design === "home") {
    return {
      selector: "section[aria-labelledby='upcoming-events-title'] > ul",
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      rowGap: viewportWidth >= 1024 ? 8 : 12,
      columnGap: viewportWidth >= 1024 ? 8 : 12,
    };
  }

  if (design === "calendar") {
    return {
      selector: "[data-page-content-boundary]",
      paddingTop: viewportWidth >= 640 ? 12 : 16,
      paddingRight: viewportWidth >= 640 ? 8 : 12,
      paddingBottom: viewportWidth >= 640 ? 12 : 16,
      paddingLeft: viewportWidth >= 640 ? 8 : 12,
      rowGap: viewportWidth >= 768 ? 8 : 12,
      columnGap: viewportWidth >= 768 ? 8 : 12,
    };
  }

  if (design === "affiliates") {
    return {
      selector: "[data-page-content-boundary]",
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      rowGap: viewportWidth >= 1280 ? 32 : 10,
      columnGap: viewportWidth >= 1280 ? 32 : 10,
    };
  }

  const shared = SHARED_SPACING[design];
  if (!shared) return undefined;

  if (design === "gallery" && viewportWidth >= 640) {
    return { ...shared, paddingRight: 80, paddingLeft: 80 };
  }

  return shared;
}
