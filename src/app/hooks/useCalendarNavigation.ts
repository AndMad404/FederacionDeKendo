import { useCallback, useEffect, useState } from "react";
import type { UpcomingEventGroup } from "../utils/calendarEvents";
import { useSwipeNavigation } from "./useSwipeNavigation";

const tabletMediaQuery = "(min-width: 768px)";

function usesTwoMonthLayout() {
  return window.matchMedia(tabletMediaQuery).matches;
}

export function useCalendarNavigation(groups: readonly UpcomingEventGroup[]) {
  const groupCount = groups.length;
  const [groupIndex, setGroupIndex] = useState(0);
  const [pageIndexes, setPageIndexes] = useState<Record<string, number>>({});

  const changeMonth = useCallback((nextIndex: number) => {
    setGroupIndex(nextIndex);
    setPageIndexes({});
  }, []);

  const changeMonthPage = useCallback((monthKey: string, nextPage: number) => {
    setPageIndexes((currentPageIndexes) => ({
      ...currentPageIndexes,
      [monthKey]: nextPage,
    }));
  }, []);

  const changeBy = useCallback(
    (offset: number) => {
      const nextIndex = groupIndex + offset;
      if (nextIndex >= 0 && nextIndex < groupCount) changeMonth(nextIndex);
    },
    [changeMonth, groupCount, groupIndex],
  );

  const previousMonth = useCallback(() => changeBy(-1), [changeBy]);
  const nextMonth = useCallback(() => changeBy(1), [changeBy]);
  let pairStart = 0;
  let previousPairIndex: number | undefined;
  let nextPairIndex: number | undefined;
  let additionalPair = false;
  for (let index = 0; index < groupCount;) {
    if (index < groupIndex) previousPairIndex = index;
    if (index <= groupIndex) pairStart = index;
    if (index > groupIndex) {
      nextPairIndex = index;
      break;
    }
    const fourMonths = groups.slice(index, index + 4);
    const expanded =
      fourMonths.length === 4 &&
      fourMonths.every((group) => group.events.length === 1);
    if (index === groupIndex) additionalPair = expanded;
    index += expanded ? 4 : 2;
  }
  const previousPair = useCallback(() => {
    if (previousPairIndex !== undefined) changeMonth(previousPairIndex);
  }, [changeMonth, previousPairIndex]);
  const nextPair = useCallback(() => {
    if (nextPairIndex !== undefined) changeMonth(nextPairIndex);
  }, [changeMonth, nextPairIndex]);
  const swipePrevious = useCallback(
    () => (usesTwoMonthLayout() ? previousPair() : previousMonth()),
    [previousPair, previousMonth],
  );
  const swipeNext = useCallback(
    () => (usesTwoMonthLayout() ? nextPair() : nextMonth()),
    [nextPair, nextMonth],
  );
  const { swipeHandlers } = useSwipeNavigation({
    onSwipeLeft: swipeNext,
    onSwipeRight: swipePrevious,
    allowInteractiveStart: true,
    preventDefaultOnSwipe: true,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(tabletMediaQuery);
    const syncGroupStart = () => {
      if (!mediaQuery.matches) return;

      if (groupIndex !== pairStart) changeMonth(pairStart);
    };

    mediaQuery.addEventListener("change", syncGroupStart);
    return () => mediaQuery.removeEventListener("change", syncGroupStart);
  }, [changeMonth, groupIndex, pairStart]);

  return {
    additionalPair,
    canPreviousPair: previousPairIndex !== undefined,
    canNextPair: nextPairIndex !== undefined,
    changeMonthPage,
    groupIndex,
    nextMonth,
    nextPair,
    pageIndexes,
    previousMonth,
    previousPair,
    swipeHandlers,
  };
}
