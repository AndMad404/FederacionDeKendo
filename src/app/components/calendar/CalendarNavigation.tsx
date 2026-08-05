import { NavigationArrowButton } from "../ui/ModalControls";
import { useLanguage } from "../../config/i18n";

interface CalendarNavigationProps {
  currentMonthLabel: string;
  monthRangeLabel: string;
  canPreviousMonth: boolean;
  canNextMonth: boolean;
  canPreviousPair: boolean;
  canNextPair: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onPreviousPair: () => void;
  onNextPair: () => void;
}

export function CalendarNavigation({
  currentMonthLabel,
  monthRangeLabel,
  canPreviousMonth,
  canNextMonth,
  canPreviousPair,
  canNextPair,
  onPreviousMonth,
  onNextMonth,
  onPreviousPair,
  onNextPair,
}: CalendarNavigationProps) {
  const { copy } = useLanguage();
  return (
    <nav
      aria-label={copy.calendar.navigation}
      className="flex items-center justify-center gap-4"
    >
      <span className="md:hidden">
        <NavigationArrowButton
          direction="previous"
          label={copy.calendar.previousMonth}
          disabled={!canPreviousMonth}
          onClick={onPreviousMonth}
        />
      </span>
      <span className="hidden md:block">
        <NavigationArrowButton
          direction="previous"
          label={copy.calendar.previousPair}
          disabled={!canPreviousPair}
          onClick={onPreviousPair}
        />
      </span>

      <p
        className="min-w-0 flex-1 text-center text-lg font-bold sm:flex-none sm:min-w-72"
        aria-live="polite"
      >
        <span className="md:hidden">{currentMonthLabel}</span>
        <span className="hidden md:inline">{monthRangeLabel}</span>
      </p>

      <span className="md:hidden">
        <NavigationArrowButton
          direction="next"
          label={copy.calendar.nextMonth}
          disabled={!canNextMonth}
          onClick={onNextMonth}
        />
      </span>
      <span className="hidden md:block">
        <NavigationArrowButton
          direction="next"
          label={copy.calendar.nextPair}
          disabled={!canNextPair}
          onClick={onNextPair}
        />
      </span>
    </nav>
  );
}
