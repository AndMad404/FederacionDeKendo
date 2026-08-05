import { useCallback, useEffect, useState } from "react";
import { useSwipeNavigation } from "./useSwipeNavigation";

const tabletMediaQuery = "(min-width: 768px)";

function usesTwoMonthLayout() {
  return window.matchMedia(tabletMediaQuery).matches;
}

export function useCalendarNavigation(groupCount: number) {
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
  const previousPair = useCallback(() => changeBy(-2), [changeBy]);
  const nextPair = useCallback(() => changeBy(2), [changeBy]);
  const swipePrevious = useCallback(
    () => changeBy(usesTwoMonthLayout() ? -2 : -1),
    [changeBy],
  );
  const swipeNext = useCallback(
    () => changeBy(usesTwoMonthLayout() ? 2 : 1),
    [changeBy],
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

      setGroupIndex((currentGroupIndex) =>
        currentGroupIndex - (currentGroupIndex % 2),
      );
    };

    mediaQuery.addEventListener("change", syncGroupStart);
    return () => mediaQuery.removeEventListener("change", syncGroupStart);
  }, []);

  return {
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
